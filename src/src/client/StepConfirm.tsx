import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase/config'
import type { BookingState } from './BookingFlow'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'


interface Props {
  booking: BookingState
  onBack: () => void
  onSuccess: () => void
}

export default function StepConfirm({ booking, onBack, onSuccess }: Props) {
  const getSaved = () => {
    try { return JSON.parse(localStorage.getItem('lastBooking') || 'null') }
    catch { return null }
  }
  const saved = getSaved()

  const [name, setName] = useState(saved?.name || '')
  const [phone, setPhone] = useState(saved?.phone || '')
  const [email, setEmail] = useState(saved?.email || '')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name || !phone || !email) {
      setError('Vyplňte prosím všechna povinná pole')
      return
    }

    setLoading(true)
    setError('')

    try {
      const startAt = new Date(`${booking.date}T${booking.time}:00`)
      const createBooking = httpsCallable(functions, 'createBooking')

      await createBooking({
        clientName: name,
        clientPhone: phone,
        clientEmail: email,
        staffId: booking.staff!.id,
        serviceIds: booking.services.map(s => s.id),
        startAt: startAt.toISOString(),
        totalDuration: booking.totalDuration,
        totalPrice: booking.totalPrice,
        notes,
      })


        // внутри handleSubmit после await createBooking(...)
        localStorage.setItem('lastBooking', JSON.stringify({
            name,
            phone,
            email,
            staffId: booking.staff!.id,
            staffName: booking.staff!.name,
            serviceIds: booking.services.map(s => s.id),
            serviceNames: booking.services.map(s => s.name).join(', '),
            totalDuration: booking.totalDuration,
            totalPrice: booking.totalPrice,
            savedAt: Date.now(),
            }))
        onSuccess()
    } catch (err: any) {
      setError(err.message || 'Něco se pokazilo. Zkuste to znovu.')
      setLoading(false)
    }
  }

  const dateLabel = booking.date
    ? format(new Date(booking.date), 'EEEE d. MMMM', { locale: cs })
    : ''

  return (
    <div className="pb-24">
      <button onClick={onBack} className="text-gray-400 mb-6 hover:text-black transition">← Zpět</button>
      <h2 className="text-2xl font-semibold mb-1">Vaše údaje</h2>
      <p className="text-gray-500 mb-6">Téměř hotovo!</p>

      {/* Shrnutí rezervace */}
      <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100">
        <div className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Shrnutí</div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Kadeřník/ce</span>
            <span className="font-medium">{booking.staff?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Datum</span>
            <span className="font-medium capitalize">{dateLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Čas</span>
            <span className="font-medium">{booking.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Služby</span>
            <span className="font-medium text-right">
              {booking.services.map(s => s.name).join(', ')}
            </span>
          </div>
          <div className="border-t border-gray-100 pt-2 mt-1 flex justify-between font-semibold">
            <span>Celkem</span>
            <span>{booking.totalPrice} Kč · {booking.totalDuration} min</span>
          </div>
        </div>
      </div>

      {/* Форма */}
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-sm text-gray-500 mb-1 block">Jméno a příjmení *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jana Nováková"
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black transition"
          />
        </div>
        <div>
          <label className="text-sm text-gray-500 mb-1 block">Telefon *</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+420 777 123 456"
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black transition"
          />
        </div>
        <div>
          <label className="text-sm text-gray-500 mb-1 block">E-mail *</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="jana@email.cz"
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black transition"
          />
        </div>
        <div>
          <label className="text-sm text-gray-500 mb-1 block">Poznámka (nepovinné)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Např. alergie na určité přípravky..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black transition resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-2xl font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? 'Odesílám...' : 'Potvrdit rezervaci'}
          </button>
        </div>
      </div>
    </div>
  )
}