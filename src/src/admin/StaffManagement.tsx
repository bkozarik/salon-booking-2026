import { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { StaffMember, DaySchedule } from '../shared/types'
import { SERVICE_CATEGORIES } from '../shared/constants'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_LABELS: Record<string, string> = {
  mon: 'Po', tue: 'Út', wed: 'St', thu: 'Čt', fri: 'Pá', sat: 'So', sun: 'Ne'
}

const EMPTY_SCHEDULE = {
  mon: { start: '09:00', end: '18:00' },
  tue: { start: '09:00', end: '18:00' },
  wed: { start: '09:00', end: '18:00' },
  thu: { start: '09:00', end: '18:00' },
  fri: { start: '09:00', end: '18:00' },
  sat: null,
  sun: null,
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    return onSnapshot(collection(db, 'staff'), snap => {
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffMember)))
    })
  }, [])

  const openNew = () => {
    setEditing({
      id: `staff-${Date.now()}`,
      name: '',
      role: 'junior',
      bio: '',
      skills: [],
      weeklySchedule: EMPTY_SCHEDULE,
      exceptions: [],
    })
    setShowModal(true)
  }

  const openEdit = (member: StaffMember) => {
    setEditing({ ...member })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!editing || !editing.name) return
    await setDoc(doc(db, 'staff', editing.id), editing)
    setShowModal(false)
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu smazat kadeřníka?')) return
    await deleteDoc(doc(db, 'staff', id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Kadeřníci</h1>
        <button
          onClick={openNew}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition"
        >
          + Přidat kadeřníka
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {staff.map(member => (
          <div key={member.id} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-semibold">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{member.name}</div>
                  <div className="text-sm text-gray-400">
                    {member.role === 'master' ? '⭐ Mistrová' : member.role === 'senior' ? 'Senior' : 'Junior'}
                  </div>
                  {member.bio && <div className="text-sm text-gray-400 mt-0.5">{member.bio}</div>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(member)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  Upravit
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="px-3 py-1.5 text-sm border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition"
                >
                  Smazat
                </button>
              </div>
            </div>

            {/* Расписание */}
            <div className="flex gap-1.5 mt-4">
              {DAYS.map(day => (
                <div
                  key={day}
                  className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium
                    ${member.weeklySchedule[day] ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}
                >
                  {DAY_LABELS[day]}
                </div>
              ))}
            </div>

            {/* Умения */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {member.skills.map(skill => (
                <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {SERVICE_CATEGORIES[skill as keyof typeof SERVICE_CATEGORIES]?.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && editing && (
        <StaffModal
          member={editing}
          onChange={setEditing}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

function StaffModal({ member, onChange, onSave, onClose }: {
  member: StaffMember
  onChange: (m: StaffMember) => void
  onSave: () => void
  onClose: () => void
}) {
  const toggleSkill = (skill: string) => {
    const skills = member.skills.includes(skill as any)
      ? member.skills.filter(s => s !== skill)
      : [...member.skills, skill as any]
    onChange({ ...member, skills })
  }

  const toggleDay = (day: string) => {
    const current = member.weeklySchedule[day as keyof typeof member.weeklySchedule]
    onChange({
      ...member,
      weeklySchedule: {
        ...member.weeklySchedule,
        [day]: current ? null : { start: '09:00', end: '18:00' },
      }
    })
  }

  const updateDayTime = (day: string, field: 'start' | 'end', value: string) => {
    onChange({
      ...member,
      weeklySchedule: {
        ...member.weeklySchedule,
        [day]: { ...member.weeklySchedule[day as keyof typeof member.weeklySchedule] as any, [field]: value },
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-lg">Kadeřník</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black">✕</button>
        </div>

        <div className="flex flex-col gap-4">
          <input
            placeholder="Celé jméno *"
            value={member.name}
            onChange={e => onChange({ ...member, name: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black"
          />
          <input
            placeholder="Bio / popis"
            value={member.bio || ''}
            onChange={e => onChange({ ...member, bio: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black"
          />

          <div>
            <div className="text-sm text-gray-500 mb-2">Pozice</div>
            <div className="flex gap-2">
              {(['junior', 'senior', 'master'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => onChange({ ...member, role })}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition
                    ${member.role === role ? 'border-black bg-black text-white' : 'border-gray-200'}`}
                >
                  {role === 'master' ? '⭐ Mistrová' : role === 'senior' ? 'Senior' : 'Junior'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-2">Dovednosti</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SERVICE_CATEGORIES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => toggleSkill(key)}
                  className={`px-3 py-1.5 rounded-full text-sm border-2 transition
                    ${member.skills.includes(key as any) ? 'border-black bg-black text-white' : 'border-gray-200'}`}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-2">Pracovní dny</div>
            <div className="flex flex-col gap-2">
              {DAYS.map(day => {
                const schedule = member.weeklySchedule[day] as DaySchedule
                return (
                  <div key={day} className="flex items-center gap-3">
                    <button
                      onClick={() => toggleDay(day)}
                      className={`w-10 text-center py-1 rounded-lg text-xs font-medium transition
                        ${schedule ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {DAY_LABELS[day]}
                    </button>
                    {schedule && (
                      <>
                        <input
                          type="time"
                          value={schedule.start}
                          onChange={e => updateDayTime(day, 'start', e.target.value)}
                          className="px-2 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-black"
                        />
                        <span className="text-gray-400 text-sm">–</span>
                        <input
                          type="time"
                          value={schedule.end}
                          onChange={e => updateDayTime(day, 'end', e.target.value)}
                          className="px-2 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-black"
                        />
                      </>
                    )}
                  </div>
                )
              })}
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