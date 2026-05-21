export type ServiceCategory = 'haircut' | 'color' | 'styling' | 'treatment' | 'kids'

export interface Service {
  id: string
  name: string
  category: ServiceCategory
  duration: number        // минуты
  price: number           // CZK
  description?: string
  staffIds: string[]      // кто умеет делать
}

export interface StaffMember {
  id: string
  name: string
  role: 'master' | 'senior' | 'junior'
  bio?: string
  photoUrl?: string
  skills: ServiceCategory[]
  weeklySchedule: WeeklySchedule
  exceptions: ScheduleException[]
}

export type DaySchedule = {
  start: string   // "09:00"
  end: string     // "18:00"
} | null           // null = выходной

export interface WeeklySchedule {
  mon: DaySchedule
  tue: DaySchedule
  wed: DaySchedule
  thu: DaySchedule
  fri: DaySchedule
  sat: DaySchedule
  sun: DaySchedule
}

export interface ScheduleException {
  date: string    // "2026-06-10"
  reason: string  // "vacation" | "sick" | "training"
  available?: DaySchedule   // если null — весь день выходной
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export interface Booking {
  id: string
  clientName: string
  clientPhone: string
  clientEmail: string
  staffId: string
  serviceIds: string[]
  startAt: Date
  endAt: Date
  totalDuration: number   // минуты
  totalPrice: number      // CZK
  status: BookingStatus
  notes?: string
  source: 'client_web' | 'admin'
  createdAt: Date
}

export interface Client {
  phone: string           // primary key
  name: string
  email: string
  noShowCount: number
  lastBooking?: {
    staffId: string
    serviceIds: string[]
    date: string
  }
  createdAt: Date
}

export interface AdminUser {
  uid: string
  email: string
  name: string
  role: 'owner' | 'receptionist'
}