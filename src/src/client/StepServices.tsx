import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { Service } from '../shared/types'
import type { BookingState } from './BookingFlow'
import { SERVICE_CATEGORIES } from '../shared/constants'

interface Props {
  booking: BookingState
  setBooking: (b: BookingState) => void
  onNext: () => void
}

export default function StepServices({ booking, setBooking, onNext }: Props) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  useEffect(() => {
    getDocs(collection(db, 'services')).then(snap => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)))
      setLoading(false)
    })
  }, [])

  const toggle = (service: Service) => {
    const exists = booking.services.find(s => s.id === service.id)
    const updated = exists
      ? booking.services.filter(s => s.id !== service.id)
      : [...booking.services, service]

    const totalDuration = updated.reduce((sum, s) => sum + s.duration, 0)
    const totalPrice = updated.reduce((sum, s) => sum + s.price, 0)

    setBooking({ ...booking, services: updated, totalDuration, totalPrice })
  }

  const isSelected = (id: string) => booking.services.some(s => s.id === id)

  const categories = ['all', ...Object.keys(SERVICE_CATEGORIES)]
  const filtered = activeCategory === 'all'
    ? services
    : services.filter(s => s.category === activeCategory)

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-1">Vyberte službu</h2>
      <p className="text-gray-500 mb-6">Můžete vybrat více služeb najednou</p>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${activeCategory === cat
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
              }`}
          >
            {cat === 'all' ? 'Vše' : SERVICE_CATEGORIES[cat as keyof typeof SERVICE_CATEGORIES].label}
          </button>
        ))}
      </div>

      {/* Services grid */}
      <div className="flex flex-col gap-3">
        {filtered.map(service => {
          const selected = isSelected(service.id)
          return (
            <button
              key={service.id}
              onClick={() => toggle(service)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all
                ${selected
                  ? 'border-black bg-black text-white'
                  : 'border-gray-100 bg-white hover:border-gray-300'
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{service.name}</div>
                  {service.description && (
                    <div className={`text-sm mt-0.5 ${selected ? 'text-gray-300' : 'text-gray-400'}`}>
                      {service.description}
                    </div>
                  )}
                  <div className={`text-sm mt-1 ${selected ? 'text-gray-300' : 'text-gray-500'}`}>
                    {service.duration} min
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{service.price} Kč</div>
                  {selected && (
                    <div className="mt-1 text-xs bg-white text-black rounded-full px-2 py-0.5">
                      ✓ vybráno
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Bottom bar */}
      {booking.services.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <div className="font-medium">{booking.services.length} služba</div>
              <div className="text-sm text-gray-500">
                {booking.totalDuration} min · {booking.totalPrice} Kč
              </div>
            </div>
            <button
              onClick={onNext}
              className="bg-black text-white px-8 py-3 rounded-2xl font-medium hover:bg-gray-800 transition"
            >
              Dál →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}