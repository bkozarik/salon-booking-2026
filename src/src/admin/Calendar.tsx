import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { cs } from 'date-fns/locale'
import type { Booking, StaffMember } from '../shared/types'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase/config'

const HOURS = Array.from({ length: 24 }, (_, i) => i).filter(h => h >= 8 && h <= 20)
const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-500',
  pending:   'bg-yellow-400',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-300',
  no_show:   'bg-red-400',
}

export default function Calendar() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [view, setView] = useState<'week' | 'day'>('week')
  const [selectedDay] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [selected, setSelected] = useState<Booking | null>(null)

  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i))
  const displayDays = view === 'week' ? days : [selectedDay]

  // Реалтайм подписка на брони
  useEffect(() => {
    const weekStart = Timestamp.fromDate(currentWeek)
    const weekEnd = Timestamp.fromDate(addDays(currentWeek, 7))
    const q = query(
      collection(db, 'bookings'),
      where('startAt', '>=', weekStart),
      where('startAt', '<', weekEnd)
    )
    return onSnapshot(q, snap => {
      setBookings(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        startAt: d.data().startAt.toDate(),
        endAt: d.data().endAt.toDate(),
        createdAt: d.data().createdAt.toDate(),
      } as Booking)))
    })
  }, [currentWeek])

  // Загрузка мастеров
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'staff'), snap => {
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffMember)))
    })
    return unsub
  }, [])

  const getBookingsForDayAndStaff = (day: Date, staffId: string) =>
    bookings.filter(b =>
      isSameDay(b.startAt, day) && b.staffId === staffId && b.status !== 'cancelled'
    )

  const getTopPercent = (date: Date) => {
    const mins = date.getHours() * 60 + date.getMinutes()
    return ((mins - 8 * 60) / (12 * 60)) * 100
  }

  const getHeightPercent = (duration: number) =>
    (duration / (12 * 60)) * 100

  const updateStatus = async (bookingId: string, status: string) => {
    const fn = httpsCallable(functions, 'updateBookingStatus')
    await fn({ bookingId, status })
    setSelected(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Kalendář</h1>
          <p className="text-gray-400 text-sm">
            {format(currentWeek, 'd. MMM', { locale: cs })} – {format(addDays(currentWeek, 6), 'd. MMM yyyy', { locale: cs })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(v => v === 'week' ? 'day' : 'week')}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50"
          >
            {view === 'week' ? 'Den' : 'Týden'}
          </button>
          <button
            onClick={() => setCurrentWeek(w => addDays(w, -7))}
            className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
          >←</button>
          <button
            onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50"
          >Dnes</button>
          <button
            onClick={() => setCurrentWeek(w => addDays(w, 7))}
            className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
          >→</button>
        </div>
      </div>

      {/* Календарная сетка */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
        {/* Заголовок — дни */}
        <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: `60px repeat(${displayDays.length * staff.length}, 1fr)` }}>
          <div className="p-2" />
          {displayDays.map(day => (
            staff.map(st => (
              <div key={`${day}-${st.id}`} className="p-2 text-center border-l border-gray-100">
                <div className="text-xs text-gray-400">{format(day, 'EEE', { locale: cs })}</div>
                <div className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'text-blue-600' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="text-xs text-gray-400 truncate">{st.name.split(' ')[0]}</div>
              </div>
            ))
          ))}
        </div>

        {/* Временная сетка */}
        <div className="relative" style={{ height: `${HOURS.length * 60}px` }}>
          {/* Линии часов */}
          {HOURS.map((h, i) => (
            <div key={h} className="absolute w-full border-t border-gray-50 flex" style={{ top: `${i * 60}px` }}>
              <div className="w-[60px] shrink-0 text-xs text-gray-300 px-2 -mt-2">{h}:00</div>
            </div>
          ))}

          {/* Колонки мастеров */}
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `60px repeat(${displayDays.length * staff.length}, 1fr)` }}>
            <div />
            {displayDays.map(day =>
              staff.map(st => {
                const dayBookings = getBookingsForDayAndStaff(day, st.id)
                return (
                  <div key={`col-${day}-${st.id}`} className="relative border-l border-gray-50">
                    {dayBookings.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setSelected(b)}
                        className={`absolute left-0.5 right-0.5 rounded-lg text-white text-xs p-1 overflow-hidden hover:opacity-90 transition ${STATUS_COLORS[b.status]}`}
                        style={{
                          top: `${getTopPercent(b.startAt)}%`,
                          height: `${getHeightPercent(b.totalDuration)}%`,
                        }}
                      >
                        <div className="font-medium truncate">{b.clientName}</div>
                        <div className="opacity-80">{format(b.startAt, 'HH:mm')}</div>
                      </button>
                    ))}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Детали брони */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg">{selected.clientName}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-black">✕</button>
            </div>
            <div className="flex flex-col gap-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Telefon</span>
                <a href={`tel:${selected.clientPhone}`} className="font-medium">{selected.clientPhone}</a>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Čas</span>
                <span className="font-medium">
                  {format(selected.startAt, 'HH:mm')} – {format(selected.endAt, 'HH:mm')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cena</span>
                <span className="font-medium">{selected.totalPrice} Kč</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium px-2 py-0.5 rounded-full text-white text-xs ${STATUS_COLORS[selected.status]}`}>
                  {selected.status}
                </span>
              </div>
            </div>

            {selected.status === 'confirmed' && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(selected.id, 'completed')}
                  className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-medium"
                >
                  ✓ Dokončeno
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'no_show')}
                  className="flex-1 bg-red-400 text-white py-2 rounded-xl text-sm font-medium"
                >
                  ✗ Nepřišel
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'cancelled')}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl text-sm font-medium"
                >
                  Zrušit
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}