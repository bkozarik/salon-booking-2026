import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import StepServices from './StepServices'
import StepDateTime from './StepDateTime'
import StepConfirm from './StepConfirm'
import StepSuccess from './StepSuccess'
import ReturnBanner from './ReturnBanner'
import type { Service, StaffMember } from '../shared/types'

export type BookingState = {
  services: Service[]
  staff: StaffMember | null
  date: string
  time: string
  totalDuration: number
  totalPrice: number
}

const INITIAL: BookingState = {
  services: [],
  staff: null,
  date: '',
  time: '',
  totalDuration: 0,
  totalPrice: 0,
}

export default function BookingFlow() {
  const [step, setStep] = useState(1)
  const [booking, setBooking] = useState<BookingState>(INITIAL)
  const [allServices, setAllServices] = useState<Service[]>([])
  const [allStaff, setAllStaff] = useState<StaffMember[]>([])

  useEffect(() => {
    getDocs(collection(db, 'services')).then(snap =>
      setAllServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)))
    )
    getDocs(collection(db, 'staff')).then(snap =>
      setAllStaff(snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffMember)))
    )
  }, [])

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => s - 1)

  const handleRepeat = (partial: Partial<BookingState>) => {
    setBooking({ ...INITIAL, ...partial })
    setStep(2)
  }

  return (
    <div className="min-h-screen bg-[#f8f6f3]">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">✂️ Salon Élégance</h1>
          <span className="text-sm text-gray-400">{Math.min(step, 3)} / 3</span>
        </div>
        <div className="h-0.5 bg-gray-100">
          <div
            className="h-full bg-black transition-all duration-500"
            style={{ width: `${(Math.min(step, 3) / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {step === 1 && (
          <>
            <ReturnBanner
              onRepeat={handleRepeat}
              allServices={allServices}
              allStaff={allStaff}
            />
            <StepServices
              booking={booking}
              setBooking={setBooking}
              onNext={next}
            />
          </>
        )}
        {step === 2 && (
          <StepDateTime
            booking={booking}
            setBooking={setBooking}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 3 && (
          <StepConfirm
            booking={booking}
            onBack={back}
            onSuccess={next}
          />
        )}
        {step === 4 && (
          <StepSuccess booking={booking} />
        )}
      </div>
    </div>
  )
}