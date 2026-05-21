import type { BookingState } from './BookingFlow'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'

export function saveLastBooking(booking: BookingState) {
  localStorage.setItem('lastBooking', JSON.stringify({
    name: '',  // заполним из формы
    staffId: booking.staff?.id,
    staffName: booking.staff?.name,
    serviceIds: booking.services.map(s => s.id),
    serviceNames: booking.services.map(s => s.name).join(', '),
    totalDuration: booking.totalDuration,
    totalPrice: booking.totalPrice,
    savedAt: Date.now(),
  }))
}

interface Props {
  booking: BookingState
}

export default function StepSuccess({ booking }: Props) {
  const dateLabel = booking.date
    ? format(new Date(booking.date), 'EEEE d. MMMM', { locale: cs })
    : ''

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center text-4xl mb-6">
        ✓
      </div>
      <h2 className="text-2xl font-semibold mb-2">Rezervace potvrzena!</h2>
      <p className="text-gray-500 mb-8">
        Těšíme se na vás v {booking.time} · {dateLabel}
      </p>

      <div className="w-full bg-white rounded-2xl p-5 border border-gray-100 text-left mb-8">
        <div className="flex flex-col gap-3 text-sm">
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
            <span className="font-medium text-right max-w-[60%]">
              {booking.services.map(s => s.name).join(', ')}
            </span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold">
            <span>Celkem</span>
            <span>{booking.totalPrice} Kč</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-6">
        Potvrzení vám zašleme na e-mail a SMS
      </p>

      <button
        onClick={() => window.location.reload()}
        className="text-sm underline text-gray-400 hover:text-black transition"
      >
        Vytvořit novou rezervaci
      </button>
    </div>
  )
}