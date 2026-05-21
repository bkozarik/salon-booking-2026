import { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { Service, StaffMember } from '../shared/types'
import { SERVICE_CATEGORIES } from '../shared/constants'

export default function ServicesManagement() {
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [editing, setEditing] = useState<Service | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    onSnapshot(collection(db, 'services'), snap =>
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)))
    )
    onSnapshot(collection(db, 'staff'), snap =>
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffMember)))
    )
  }, [])

  const openNew = () => {
    setEditing({
      id: `svc-${Date.now()}`,
      name: '',
      category: 'haircut',
      duration: 60,
      price: 500,
      description: '',
      staffIds: [],
    })
    setShowModal(true)
  }

  const openEdit = (service: Service) => {
    setEditing({ ...service })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!editing || !editing.name) return
    await setDoc(doc(db, 'services', editing.id), editing)
    setShowModal(false)
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu smazat službu?')) return
    await deleteDoc(doc(db, 'services', id))
  }

  const grouped = Object.keys(SERVICE_CATEGORIES).reduce((acc, cat) => {
    acc[cat] = services.filter(s => s.category === cat)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Služby</h1>
        <button
          onClick={openNew}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition"
        >
          + Přidat službu
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {Object.entries(SERVICE_CATEGORIES).map(([cat, info]) => {
          const catServices = grouped[cat] || []
          if (catServices.length === 0) return null
          return (
            <div key={cat}>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                {info.icon} {info.label}
              </div>
              <div className="flex flex-col gap-2">
                {catServices.map(service => (
                  <div key={service.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{service.name}</div>
                      {service.description && (
                        <div className="text-sm text-gray-400 mt-0.5">{service.description}</div>
                      )}
                      <div className="text-sm text-gray-400 mt-1">
                        {service.duration} min · {service.price} Kč
                        <span className="ml-2">· {service.staffIds.length} kadeřníků</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(service)}
                        className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                      >
                        Upravit
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="px-3 py-1.5 text-sm border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition"
                      >
                        Smazat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && editing && (
        <ServiceModal
          service={editing}
          staff={staff}
          onChange={setEditing}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

function ServiceModal({ service, staff, onChange, onSave, onClose }: {
  service: Service
  staff: StaffMember[]
  onChange: (s: Service) => void
  onSave: () => void
  onClose: () => void
}) {
  const toggleStaff = (id: string) => {
    const ids = service.staffIds.includes(id)
      ? service.staffIds.filter(s => s !== id)
      : [...service.staffIds, id]
    onChange({ ...service, staffIds: ids })
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-lg">Služba</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black">✕</button>
        </div>

        <div className="flex flex-col gap-3">
          <input
            placeholder="Název služby *"
            value={service.name}
            onChange={e => onChange({ ...service, name: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black"
          />
          <input
            placeholder="Popis (nepovinné)"
            value={service.description || ''}
            onChange={e => onChange({ ...service, description: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black"
          />

          <div>
            <div className="text-sm text-gray-500 mb-2">Kategorie</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SERVICE_CATEGORIES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => onChange({ ...service, category: key as any })}
                  className={`px-3 py-1.5 rounded-full text-sm border-2 transition
                    ${service.category === key ? 'border-black bg-black text-white' : 'border-gray-200'}`}
                >
                  {val.icon} {val.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-1">Doba trvání (min)</div>
              <input
                type="number"
                value={service.duration}
                onChange={e => onChange({ ...service, duration: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black"
              />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-1">Cena (Kč)</div>
              <input
                type="number"
                value={service.price}
                onChange={e => onChange({ ...service, price: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-2">Kdo tuto službu dělá</div>
            <div className="flex flex-col gap-2">
              {staff.map(st => (
                <label key={st.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={service.staffIds.includes(st.id)}
                    onChange={() => toggleStaff(st.id)}
                  />
                  <span className="text-sm">{st.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {st.role === 'master' ? '⭐' : st.role === 'senior' ? 'Senior' : 'Junior'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onSave}
          className="w-full mt-6 bg-black text-white py-3 rounded-2xl font-medium hover:bg-gray-800 transition"
        >
          Uložit
        </button>
      </div>
    </div>
  )
}