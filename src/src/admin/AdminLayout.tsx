import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../shared/hooks/useAuth'

const NAV_ITEMS = [
  { to: '/admin/calendar', label: 'Kalendář', icon: '📅' },
  { to: '/admin/bookings', label: 'Rezervace', icon: '📋' },
  { to: '/admin/staff', label: 'Kadeřníci', icon: '👥' },
  { to: '/admin/services', label: 'Služby', icon: '✂️' },
  { to: '/admin/analytics', label: 'Analytika', icon: '📊', ownerOnly: true },
]

export default function AdminLayout() {
  const { adminData, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/admin')
  }

  const items = NAV_ITEMS.filter(i => !i.ownerOnly || adminData?.role === 'owner')

  return (
    <div className="min-h-screen bg-[#f8f6f3]">

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-56 bg-white border-r border-gray-100 flex-col fixed h-full">
        <div className="p-5 border-b border-gray-100">
          <div className="font-semibold">✂️ Salon Admin</div>
          <div className="text-xs text-gray-400 mt-1">{adminData?.name}</div>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-sm transition ${isActive ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'}`
              }
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-gray-400 hover:text-black transition text-left"
          >
            Odhlásit se
          </button>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="font-semibold">✂️ Salon Admin</div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{adminData?.name}</span>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-black">
            Odhlásit
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="lg:ml-56 pb-20 lg:pb-0">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10">
        <div className="flex">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 text-xs transition
                ${isActive ? 'text-black font-medium' : 'text-gray-400'}`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span className="mt-0.5">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

    </div>
  )
}