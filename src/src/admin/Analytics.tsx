import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { Booking, StaffMember } from '../shared/types'
import { startOfWeek, startOfMonth, endOfMonth, addDays, format } from 'date-fns'
import { cs } from 'date-fns/locale'

type Period = 'week' | 'month'

export default function Analytics() {
  const [period, setPeriod] = useState<Period>('week')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])

  const now = new Date()
  const rangeStart = period === 'week'
    ? startOfWeek(now, { weekStartsOn: 1 })
    : startOfMonth(now)
  const rangeEnd = period === 'week'
    ? addDays(rangeStart, 7)
    : endOfMonth(now)

  useEffect(() => {
    const q = query(
      collection(db, 'bookings'),
      where('startAt', '>=', Timestamp.fromDate(rangeStart)),
      where('startAt', '<', Timestamp.fromDate(rangeEnd))
    )
    return onSnapshot(q, snap => {
      setBookings(snap.docs.map(d => ({
        id: d.id, ...d.data(),
        startAt: d.data().startAt.toDate(),
        endAt: d.data().endAt.toDate(),
        createdAt: d.data().createdAt?.toDate(),
      } as Booking)))
    })
  }, [period])

  useEffect(() => {
    return onSnapshot(collection(db, 'staff'), snap =>
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffMember)))
    )
  }, [])

  const completed = bookings.filter(b => b.status === 'completed')
  const cancelled = bookings.filter(b => b.status === 'cancelled')
  const noShow = bookings.filter(b => b.status === 'no_show')
  const totalRevenue = completed.reduce((sum, b) => sum + b.totalPrice, 0)
  const avgRevenue = completed.length ? Math.round(totalRevenue / completed.length) : 0

  // Выручка по мастерам
  const revenueByStaff = staff.map(st => {
    const stBookings = completed.filter(b => b.staffId === st.id)
    return {
      staff: st,
      revenue: stBookings.reduce((sum, b) => sum + b.totalPrice, 0),
      count: stBookings.length,
    }
  }).sort((a, b) => b.revenue - a.revenue)

  const maxRevenue = Math.max(...revenueByStaff.map(s => s.revenue), 1)

  // Загрузка по дням
  const days = Array.from({ length: period === 'week' ? 7 : 30 }, (_, i) => addDays(rangeStart, i))
  const bookingsByDay = days.map(day => ({
    day,
    count: bookings.filter(b =>
      format(b.startAt, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') &&
      b.status !== 'cancelled'
    ).length
  }))
  const maxDay = Math.max(...bookingsByDay.map(d => d.count), 1)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Analytika</h1>
        <div className="flex gap-2">
          {(['week', 'month'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition
                ${period === p ? 'bg-black text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
            >
              {p === 'week' ? 'Týden' : 'Měsíc'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI карточки */}
      <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
        {[
          { label: 'Tržby', value: `${totalRevenue.toLocaleString()} Kč`, sub: `ø ${avgRevenue} Kč / návštěva` },
          { label: 'Dokončeno', value: completed.length, sub: 'rezervací' },
          { label: 'No-show', value: noShow.length, sub: `${bookings.length ? Math.round(noShow.length / bookings.length * 100) : 0}% z celku` },
          { label: 'Zrušeno', value: cancelled.length, sub: 'rezervací' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="text-sm text-gray-400 mb-1">{card.label}</div>
            <div className="text-2xl font-semibold">{card.value}</div>
            <div className="text-xs text-gray-400 mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Выручка по мастерам */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="font-medium mb-4">Tržby podle kadeřníka</div>
          <div className="flex flex-col gap-3">
            {revenueByStaff.map(({ staff: st, revenue, count }) => (
              <div key={st.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{st.name}</span>
                  <span className="text-gray-500">{revenue.toLocaleString()} Kč · {count} návštěv</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full transition-all duration-500"
                    style={{ width: `${(revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Загрузка по дням */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="font-medium mb-4">Rezervace po dnech</div>
          <div className="flex items-end gap-1 h-32">
            {bookingsByDay.map(({ day, count }) => (
              <div key={day.toISOString()} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '100px' }}>
                  <div
                    className="absolute bottom-0 w-full bg-black rounded-t-lg transition-all duration-500"
                    style={{ height: `${(count / maxDay) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400">
                  {format(day, period === 'week' ? 'EEE' : 'd', { locale: cs })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}