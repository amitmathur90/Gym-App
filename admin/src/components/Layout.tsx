import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'

interface NavItem {
  to: string
  label: string
  icon: string
  end?: boolean
}

const ADMIN_SECTIONS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Main',
    items: [
      { to: '/', label: 'Dashboard', icon: '📊', end: true },
      { to: '/members', label: 'Members', icon: '👥' },
      { to: '/trainers', label: 'Trainers', icon: '🏋️' },
      { to: '/plans', label: 'Membership Plans', icon: '🎫' },
      { to: '/classes', label: 'Classes', icon: '🗓️' },
    ],
  },
  {
    heading: 'Coaching',
    items: [
      { to: '/diet-plans', label: 'Diet Plans', icon: '🥗' },
      { to: '/foods', label: 'Food Library', icon: '🍽️' },
    ],
  },
  {
    heading: 'Billing',
    items: [
      { to: '/payments', label: 'Payments & Revenue', icon: '💳' },
      { to: '/dues', label: 'Dues & Renewals', icon: '⏰' },
    ],
  },
  {
    heading: 'Settings',
    items: [{ to: '/settings', label: 'Branding', icon: '🎨' }],
  },
]

const TRAINER_SECTIONS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Main',
    items: [
      { to: '/trainer', label: 'Dashboard', icon: '📊', end: true },
      { to: '/trainer/members', label: 'My Members', icon: '👥' },
      { to: '/trainer/sessions', label: 'Sessions', icon: '📅' },
    ],
  },
  {
    heading: 'Coaching',
    items: [
      { to: '/trainer/workout-plans', label: 'Workout Plans', icon: '🏋️' },
      { to: '/trainer/diet-plans', label: 'Diet Plans', icon: '🥗' },
    ],
  },
  {
    heading: 'Communication',
    items: [
      { to: '/trainer/messages', label: 'Messages', icon: '💬' },
      { to: '/trainer/alerts', label: 'Notifications', icon: '🔔' },
    ],
  },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const isTrainer = user?.role === 'TRAINER'
  const sections = isTrainer ? TRAINER_SECTIONS : ADMIN_SECTIONS

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="w-64 shrink-0 bg-surface border-r border-border flex flex-col">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple flex items-center justify-center text-lg shrink-0">
            🏋️‍♂️
          </span>
          <div className="min-w-0">
            <div className="font-bold text-text leading-none truncate">Gym Fit</div>
            <div className="text-xs text-text-muted mt-0.5">{isTrainer ? 'Trainer Panel' : 'Admin Panel'}</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.heading}>
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint mb-1.5">
                {section.heading}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary/15 text-primary'
                          : 'text-text-muted hover:bg-surface-hover hover:text-text'
                      }`
                    }
                  >
                    <span className="text-base leading-none">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-text truncate">{user?.name}</div>
              <div className="text-xs text-text-faint truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-sm text-red hover:bg-red/10 rounded-lg py-2 font-medium transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 shrink-0 border-b border-border bg-surface/60 backdrop-blur flex items-center gap-4 px-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search members, trainers, workouts…"
                className="w-full rounded-lg border border-border bg-surface-raised text-text placeholder:text-text-faint pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-xs">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          </div>
        </header>
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
