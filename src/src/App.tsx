import { Routes, Route } from 'react-router-dom'
import BookingFlow from './client/BookingFlow'
import AdminLogin from './admin/AdminLogin'
import AdminLayout from './admin/AdminLayout'
import Calendar from './admin/Calendar'
import BookingsList from './admin/BookingsList'
import StaffManagement from './admin/StaffManagement'
import ServicesManagement from './admin/ServicesManagement'
import Analytics from './admin/Analytics'
import ProtectedRoute from './shared/components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      {/* Клиентская часть */}
      <Route path="/" element={<BookingFlow />} />

      {/* Админка */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/*" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="calendar" element={<Calendar />} />
        <Route path="bookings" element={<BookingsList />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="services" element={<ServicesManagement />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  )
}