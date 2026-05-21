import { useEffect, useState } from 'react'
import type { BookingState } from './BookingFlow'
import type { Service, StaffMember } from '../shared/types'

interface SavedBooking {
  name: string
  staffId: string
  staffName: string
  serviceIds: string[]
  serviceNames: string
  totalDuration: number
  totalPrice: number
  savedAt: number
}

interface Props {
  onRepeat: (partial: Partial<BookingState>) => void
  allServices: Service[]
  allStaff: StaffMember[]
}

const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000

export default function ReturnBanner({ onRepeat, allServices, allStaff }: Props) {
  const [saved, setSaved] = useState<SavedBooking | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lastBooking')
      if (!raw) return
      const data = JSON.parse(raw) as SavedBooking
      if (Date.now() - data.savedAt > NINETY_DAYS) return
      setSaved(data)
    } catch {}
  }, [])

  if (!saved) return null

  const handleRepeat = () => {
    const services = allServices.filter(s => saved.serviceIds.includes(s.id))
    const staff = allStaff.find(s => s.id === saved.staffId) || null
    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0)
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0)

    onRepeat({ services, staff, totalDuration, totalPrice })
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium mb-0.5">👋 Vítejte zpět{saved.name ? `, ${saved.name.split(' ')[0]}` : ''}!</div>
          <div className="text-sm text-gray-500">
            Minule: {saved.staffName} · {saved.serviceNames}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {saved.totalDuration} min · {saved.totalPrice} Kč
          </div>
        </div>
        <button
          onClick={handleRepeat}
          className="shrink-0 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition"
        >
          Zarezervovat stejné
        </button>
      </div>
    </div>
  )
}