import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const ADMIN_NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/members', label: 'Members', icon: '👥' },
  { to: '/trainers', label: 'Trainers', icon: '🏋️' },
  { to: '/plans', label: 'Membership Plans', icon: '🎫' },
  { to: '/diet-plans', label: 'Diet Plans', icon: '🥗' },
  { to: '/foods', label: 'Food Library', icon: '🍽️' },
  { to: '/classes', label: 'Class Scheduling', icon: '🗓️' },
  { to: '/payments', label: 'Payments & Revenue', icon: '💳' },
  { to: '/dues', label: 'Dues & Renewals', icon: '⏰' },
]

const TRAINER_NAV = [
  { to: '/trainer', label: 'Dashboard', icon: '📊', end: true },
  { to: '/trainer/members', label: 'My Members', icon: '👥' },
  { to: '/trainer/sessions', label: 'Sessions', icon: '📅' },
  { to: '/trainer/workout-plans', label: 'Workout Plans', icon: '🏋️' },
  { to: '/trainer/diet-plans', label: 'Diet Plans', icon: '🥗' },
  { to: '/trainer/messages', label: 'Messages', icon: '💬' },
  { to: '/trainer/alerts', label: 'Notifications', icon: '🔔' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const isTrainer = user?.role === 'TRAINER'
  const navItems = isTrainer ? TRAINER_NAV : ADMIN_NAV

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200">
          <span className="text-2xl">🏋️‍♂️</span>
          <div>
            <div className="font-bold text-slate-900 leading-none">Gym Fit</div>
            <div className="text-xs text-slate-500">{isTrainer ? 'Trainer Panel' : 'Admin Panel'}</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <div className="text-sm font-medium text-slate-900 truncate">{user?.name}</div>
          <div className="text-xs text-slate-500 truncate mb-2">{user?.email}</div>
          <button
            onClick={logout}
            className="w-full text-sm text-red-600 hover:bg-red-50 rounded-lg py-2 font-medium transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
