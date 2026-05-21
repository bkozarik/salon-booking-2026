import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase/config'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import type { Booking, StaffMember, Service } from '../shared/types'
import { BOOKING_STATUS_LABELS } from '../shared/constants'

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700',
  pending:   'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  no_show:   'bg-red-100 text-red-600',
}

export default function BookingsList() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('startAt', 'desc'))
    return onSnapshot(q, snap => {
      setBookings(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        startAt: d.data().startAt.toDate(),
        endAt: d.data().endAt.toDate(),
        createdAt: d.data().createdAt?.toDate(),
      } as Booking)))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    onSnapshot(collection(db, 'staff'), snap =>
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffMember)))
    )
    onSnapshot(collection(db, 'services'), snap =>
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)))
    )
  }, [])

  const getStaffName = (id: string) => staff.find(s => s.id === id)?.name || id
  const getServiceNames = (ids: string[]) =>
    ids.map(id => services.find(s => s.id === id)?.name || id).join(', ')

  const filtered = filterStatus === 'all'
    ? bookings
    : bookings.filter(b => b.status === filterStatus)

  const updateStatus = async (bookingId: string, status: string) => {
    const fn = httpsCallable(functions, 'updateBookingStatus')
    await fn({ bookingId, status })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Rezervace</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition"
        >
          + Přidat rezervaci
        </button>
      </div>

      {/* Фильтр статусов */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['all', ...Object.keys(BOOKING_STATUS_LABELS)].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition
              ${filterStatus === status ? 'bg-black text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            {status === 'all' ? 'Vše' : BOOKING_STATUS_LABELS[status as keyof typeof BOOKING_STATUS_LABELS].label}
            {status !== 'all' && (
              <span className="ml-1 text-xs opacity-60">
                ({bookings.filter(b => b.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Таблица */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">Žádné rezervace</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(b => (
            <div key={b.id} className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{b.clientName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status]}`}>
                      {BOOKING_STATUS_LABELS[b.status as keyof typeof BOOKING_STATUS_LABELS]?.label}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    {format(b.startAt, 'EEEE d. MMMM, HH:mm', { locale: cs })} · {getStaffName(b.staffId)}
                  </div>
                  <div className="text-sm text-gray-400 truncate">
                    {getServiceNames(b.serviceIds)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold">{b.totalPrice} Kč</div>
                  <div className="text-xs text-gray-400">{b.totalDuration} min</div>
                </div>
              </div>

              {b.status === 'confirmed' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => updateStatus(b.id, 'completed')}
                    className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
                  >
                    ✓ Dokončeno
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, 'no_show')}
                    className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                  >
                    ✗ Nepřišel
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, 'cancelled')}
                    className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition"
                  >
                    Zrušit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddBookingModal
          staff={staff}
          services={services}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

function AddBookingModal({ staff, services, onClose }: {
  staff: StaffMember[]
  services: Service[]
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [staffId, setStaffId] = useState('')
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedServices = services.filter(s => serviceIds.includes(s.id))
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)

  useEffect(() => {
    if (!staffId || !date || !totalDuration) return
    const fn = httpsCallable(functions, 'getAvailableSlots')
    fn({ staffId, date, totalDuration }).then((res: any) => setSlots(res.data.slots))
  }, [staffId, date, totalDuration])

  const toggleService = (id: string) => {
    setServiceIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
    setTime('')
  }

  const handleSubmit = async () => {
    if (!name || !phone || !staffId || !serviceIds.length || !date || !time) {
      setError('Vyplňte všechna povinná pole')
      return
    }
    setLoading(true)
    try {
      const startAt = new Date(`${date}T${time}:00`)
      const fn = httpsCallable(functions, 'createBooking')
      await fn({ clientName: name, clientPhone: phone, clientEmail: email || 'admin@salon.cz', staffId, serviceIds, startAt: startAt.toISOString(), totalDuration, totalPrice, source: 'admin' })
      onClose()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-lg">Nová rezervace</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black">✕</button>
        </div>

        <div className="flex flex-col gap-3">
          <input placeholder="Jméno klienta *" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black" />
          <input placeholder="Telefon *" value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black" />
          <input placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black" />

          <select value={staffId} onChange={e => { setStaffId(e.target.value); setTime('') }}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black">
            <option value="">Vyberte kadeřníka *</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <div className="text-sm text-gray-500 mb-1">Služby *</div>
          <div className="flex flex-col gap-2">
            {services.map(s => (
              <label key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} />
                <span className="flex-1 text-sm">{s.name}</span>
                <span className="text-sm text-gray-400">{s.price} Kč</span>
              </label>
            ))}
          </div>

          <input type="date" value={date} onChange={e => { setDate(e.target.value); setTime('') }}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black" />

          {slots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {slots.map(slot => (
                <button key={slot} onClick={() => setTime(slot)}
                  className={`px-3 py-1.5 rounded-full text-sm border-2 transition
                    ${time === slot ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-400'}`}>
                  {slot}
                </button>
              ))}
            </div>
          )}

          {totalDuration > 0 && (
            <div className="text-sm text-gray-500 text-right">
              {totalDuration} min · {totalPrice} Kč
            </div>
          )}
        </div>

        {error && <div className="mt-3 text-red-500 text-sm">{error}</div>}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full mt-6 bg-black text-white py-3 rounded-2xl font-medium hover:bg-gray-800 transition disabled:opacity-50">
          {loading ? 'Ukládám...' : 'Vytvořit rezervaci'}
        </button>
      </div>
    </div>
  )
}