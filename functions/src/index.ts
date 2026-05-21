import * as admin from 'firebase-admin'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { Timestamp } from 'firebase-admin/firestore'

const CORS_ORIGINS = true


admin.initializeApp()
const db = admin.firestore()

interface CreateBookingData {
  clientName: string
  clientPhone: string
  clientEmail: string
  staffId: string
  serviceIds: string[]
  startAt: string   // ISO string
  totalDuration: number
  totalPrice: number
}

// Главная функция — создание брони через транзакцию
export const createBooking = onCall(
  { region: 'europe-west1', cors: CORS_ORIGINS, invoker: 'public' },
  async (request) => {
    const data = request.data as CreateBookingData

    // Валидация
    if (!data.clientName || !data.clientPhone || !data.staffId) {
      throw new HttpsError('invalid-argument', 'Chybí povinné údaje')
    }

    const startAt = new Date(data.startAt)
    const endAt = new Date(startAt.getTime() + data.totalDuration * 60000)

    // Транзакция — защита от двойного бронирования
    const bookingId = await db.runTransaction(async (tx) => {
      // Проверяем конфликты в расписании мастера
      const conflictsSnap = await tx.get(
        db.collection('bookings')
          .where('staffId', '==', data.staffId)
          .where('status', 'in', ['pending', 'confirmed'])
          .where('startAt', '<', Timestamp.fromDate(endAt))
          .where('endAt', '>', Timestamp.fromDate(startAt))
      )

      if (!conflictsSnap.empty) {
        throw new HttpsError(
          'already-exists',
          'Tento termín je již obsazen. Vyberte prosím jiný čas.'
        )
      }

      // Создаём бронь
      const bookingRef = db.collection('bookings').doc()
      tx.set(bookingRef, {
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail,
        staffId: data.staffId,
        serviceIds: data.serviceIds,
        startAt: Timestamp.fromDate(startAt),
        endAt: Timestamp.fromDate(endAt),
        totalDuration: data.totalDuration,
        totalPrice: data.totalPrice,
        status: 'confirmed',
        source: 'client_web',
        createdAt: Timestamp.now(),
      })

      // Обновляем профиль клиента (upsert по телефону)
      const clientRef = db.collection('clients').doc(data.clientPhone)
      tx.set(clientRef, {
        name: data.clientName,
        email: data.clientEmail,
        phone: data.clientPhone,
        lastBooking: {
          staffId: data.staffId,
          serviceIds: data.serviceIds,
          date: startAt.toISOString().split('T')[0],
        },
        updatedAt: Timestamp.now(),
      }, { merge: true })

      return bookingRef.id
    })

    // Mock уведомление — в продакшне здесь был бы Twilio SMS
    console.log(`[MOCK SMS] Booking confirmed for ${data.clientPhone}: ${bookingId}`)
    console.log(`[MOCK EMAIL] Confirmation sent to ${data.clientEmail}`)

    return { bookingId, message: 'Rezervace byla úspěšně vytvořena' }
  }
)

// Отмена брони
export const cancelBooking = onCall(
  { region: 'europe-west1', cors: CORS_ORIGINS, invoker: 'public' },

  async (request) => {
    const { bookingId, reason } = request.data

    if (!bookingId) {
      throw new HttpsError('invalid-argument', 'Chybí ID rezervace')
    }

    const bookingRef = db.collection('bookings').doc(bookingId)
    const booking = await bookingRef.get()

    if (!booking.exists) {
      throw new HttpsError('not-found', 'Rezervace nenalezena')
    }

    if (booking.data()?.status === 'completed') {
      throw new HttpsError('failed-precondition', 'Dokončenou rezervaci nelze zrušit')
    }

    await bookingRef.update({
      status: 'cancelled',
      cancelReason: reason || '',
      updatedAt: Timestamp.now(),
    })

    return { message: 'Rezervace byla zrušena' }
  }
)

// Обновление статуса (completed, no_show) — только для adminů
export const updateBookingStatus = onCall(
  { region: 'europe-west1', cors: CORS_ORIGINS, invoker: 'public' },
  async (request) => {
    // Проверяем что вызывает авторизованный пользователь
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Musíte být přihlášeni')
    }

    const { bookingId, status } = request.data
    const allowed = ['completed', 'no_show', 'confirmed', 'cancelled']

    if (!allowed.includes(status)) {
      throw new HttpsError('invalid-argument', 'Neplatný status')
    }

    const bookingRef = db.collection('bookings').doc(bookingId)
    await bookingRef.update({
      status,
      updatedAt: Timestamp.now(),
    })

    // Если no_show — увеличиваем счётчик клиента
    if (status === 'no_show') {
      const booking = await bookingRef.get()
      const phone = booking.data()?.clientPhone
      if (phone) {
        const clientRef = db.collection('clients').doc(phone)
        const client = await clientRef.get()
        const current = client.data()?.noShowCount || 0
        await clientRef.update({ noShowCount: current + 1 })
      }
    }

    return { message: 'Status byl aktualizován' }
  }
)

export const getAvailableSlots = onCall(
  { region: 'europe-west1', cors: CORS_ORIGINS, invoker: 'public' },
  async (request) => {
    const { staffId, date, totalDuration } = request.data

    if (!staffId || !date || !totalDuration) {
      throw new HttpsError('invalid-argument', 'Chybí parametry')
    }

    const staffDoc = await db.collection('staff').doc(staffId).get()
    if (!staffDoc.exists) {
      throw new HttpsError('not-found', 'Kadeřník nenalezen')
    }

    const staff = staffDoc.data()!
    const dayKey = ['sun','mon','tue','wed','thu','fri','sat'][new Date(date).getDay()]
    const schedule = staff.weeklySchedule[dayKey]
    const exception = staff.exceptions?.find((e: any) => e.date === date)
    const daySchedule = exception ? exception.available : schedule

    if (!daySchedule) return { slots: [] }

    const slots: string[] = []
    const [startH, startM] = daySchedule.start.split(':').map(Number)
    const [endH, endM] = daySchedule.end.split(':').map(Number)
    const workStart = startH * 60 + startM
    const workEnd = endH * 60 + endM

    // Тянем все брони мастера — избегаем timezone проблем с date range
    const bookingsSnap = await db.collection('bookings')
      .where('staffId', '==', staffId)
      .where('status', 'in', ['pending', 'confirmed'])
      .get()

    const busySlots = bookingsSnap.docs.map(d => ({
      start: d.data().startAt.toDate().getTime(),
      end: d.data().endAt.toDate().getTime(),
    }))

    // Базовая дата в локальном времени (Prague UTC+2)
    const baseDate = new Date(`${date}T00:00:00+02:00`).getTime()

    for (let minutes = workStart; minutes + totalDuration <= workEnd; minutes += 30) {
      const slotStart = baseDate + minutes * 60000
      const slotEnd = slotStart + totalDuration * 60000

      const isBusy = busySlots.some(b => slotStart < b.end && slotEnd > b.start)

      if (!isBusy) {
        const h = Math.floor(minutes / 60).toString().padStart(2, '0')
        const m = (minutes % 60).toString().padStart(2, '0')
        slots.push(`${h}:${m}`)
      }
    }

    return { slots }
  }
)