import { useEffect, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase/config'
import type { StaffMember } from '../shared/types'
import type { BookingState } from './BookingFlow'
import { format, addDays, startOfToday, isSameDay } from 'date-fns'
import { cs } from 'date-fns/locale'
import { collection, getDocs } from 'firebase/firestore'

interface Props {
  booking: BookingState
  setBooking: (b: BookingState) => void
  onNext: () => void
  onBack: () => void
}

export default function StepDateTime({ booking, setBooking, onNext, onBack }: Props) {
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(booking.staff)
  const [selectedDate, setSelectedDate] = useState<Date | null>(booking.date ? new Date(booking.date) : null)
  const [slots, setSlots] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState(booking.time)
  const [loadingSlots, setLoadingSlots] = useState(false)

  const days = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i))

    useEffect(() => {
        getDocs(collection(db, 'staff')).then(snap => {
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffMember))
            const needed = booking.services.map(s => s.category)
            const capable = needed.length > 0
            ? all.filter(st => needed.every(cat => st.skills.includes(cat)))
            : all
            setStaffList(capable)
        })
    }, [booking.services])

  useEffect(() => {
    if (!selectedStaff || !selectedDate) return
    setLoadingSlots(true)
    setSelectedTime('')
    setSlots([])

    const getSlots = httpsCallable(functions, 'getAvailableSlots')
    getSlots({
      staffId: selectedStaff.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      totalDuration: booking.totalDuration,
    }).then((res: any) => {
      setSlots(res.data.slots)
      setLoadingSlots(false)
    }).catch(() => setLoadingSlots(false))
  }, [selectedStaff, selectedDate])

  const canContinue = selectedStaff && selectedDate && selectedTime

  const handleNext = () => {
    if (!canContinue) return
    setBooking({
      ...booking,
      staff: selectedStaff,
      date: format(selectedDate!, 'yyyy-MM-dd'),
      time: selectedTime,
    })
    onNext()
  }

  return (
    <div className="pb-24">
      <button onClick={onBack} className="text-gray-400 mb-6 hover:text-black transition">← Zpět</button>
      <h2 className="text-2xl font-semibold mb-1">Vyberte termín</h2>
      <p className="text-gray-500 mb-6">Celková doba: {booking.totalDuration} min</p>

      {/* Выбор мастера */}
      <div className="mb-6">
        <div className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Kadeřník/ce</div>
        <div className="flex flex-col gap-2">
          {staffList.map(st => (
            <button
              key={st.id}
              onClick={() => setSelectedStaff(st)}
              className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left
                ${selectedStaff?.id === st.id
                  ? 'border-black bg-black text-white'
                  : 'border-gray-100 bg-white hover:border-gray-300'
                }`}
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg shrink-0">
                {st.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium">{st.name}</div>
                <div className={`text-sm ${selectedStaff?.id === st.id ? 'text-gray-300' : 'text-gray-400'}`}>
                  {st.role === 'master' ? '⭐ Mistrová' : st.role === 'senior' ? 'Senior' : 'Junior'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Выбор даты */}
      {selectedStaff && (
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Datum</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map(day => (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl border-2 transition-all
                  ${selectedDate && isSameDay(day, selectedDate)
                    ? 'border-black bg-black text-white'
                    : 'border-gray-100 bg-white hover:border-gray-300'
                  }`}
              >
                <span className="text-xs uppercase">{format(day, 'EEE', { locale: cs })}</span>
                <span className="text-lg font-semibold">{format(day, 'd')}</span>
                <span className="text-xs">{format(day, 'MMM', { locale: cs })}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Выбор времени */}
      {selectedStaff && selectedDate && (
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Čas</div>
          {loadingSlots ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Žádné volné termíny v tento den
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all
                    ${selectedTime === slot
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                    }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Кнопка продолжить */}
      {canContinue && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleNext}
              className="w-full bg-black text-white py-3 rounded-2xl font-medium hover:bg-gray-800 transition"
            >
              Pokračovat →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}