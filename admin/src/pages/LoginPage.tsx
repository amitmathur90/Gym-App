import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { inputClass } from '../components/ui'

const TABS = [
  {
    key: 'ADMIN' as const,
    label: 'Admin',
    icon: '🏋️‍♂️',
    title: 'Gym Fit Admin',
    subtitle: 'Sign in with an admin account',
    defaultEmail: 'admin@gymapp.com',
    hint: 'Seeded admin: admin@gymapp.com / Admin123!',
  },
  {
    key: 'TRAINER' as const,
    label: 'Trainer',
    icon: '🏋️',
    title: 'Gym Fit Trainer',
    subtitle: 'Sign in with your trainer account',
    defaultEmail: '',
    hint: '',
  },
]

export default function LoginPage() {
  const { login, status, user } = useAuth()
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('ADMIN')
  const [email, setEmail] = useState(TABS[0].defaultEmail)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (status === 'authenticated') return <Navigate to={user?.role === 'TRAINER' ? '/trainer' : '/'} replace />

  const active = TABS.find((t) => t.key === tab)!

  function switchTab(key: (typeof TABS)[number]['key']) {
    setTab(key)
    setError(null)
    setEmail(TABS.find((t) => t.key === key)!.defaultEmail)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password, tab)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Hero panel — swap the background style below for a real photo:
          style={{ backgroundImage: "url('/login-hero.jpg')" }} and drop
          the file in admin/public/. */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(238,42,92,0.35), transparent 45%), radial-gradient(circle at 80% 70%, rgba(139,92,246,0.3), transparent 50%), linear-gradient(160deg, #0a0d14 0%, #12151f 55%, #1a0d16 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='white' stroke-width='2'%3E%3Cpath d='M10 60h20M90 60h20M30 60h60M25 45v30M35 50v20M85 45v30M95 50v20'/%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: '120px 120px',
          }}
        />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple flex items-center justify-center text-2xl mb-6">
            🏋️‍♂️
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4 max-w-md">
            Run your gym like a pro, from one dashboard.
          </h2>
          <p className="text-white/60 max-w-sm">
            Members, trainers, classes, payments and progress — everything your team needs, in one place.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm bg-surface-raised rounded-2xl border border-border shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary to-purple flex items-center justify-center text-2xl lg:hidden">
              {active.icon}
            </div>
            <h1 className="text-xl font-bold text-text">{active.title}</h1>
            <p className="text-sm text-text-muted mt-1">{active.subtitle}</p>
          </div>

          <div className="flex gap-1 bg-surface-hover rounded-lg p-1 mb-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => switchTab(t.key)}
                className={`flex-1 px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  tab === t.key ? 'bg-surface-raised text-primary shadow-sm' : 'text-text-muted'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <label className="block mb-4">
              <span className="block text-sm font-medium text-text mb-1">Email</span>
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block mb-4">
              <span className="block text-sm font-medium text-text mb-1">Password</span>
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <p className="text-sm text-red mb-4">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-lg py-2.5 font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          {active.hint && <p className="text-xs text-text-faint mt-6 text-center">{active.hint}</p>}
        </div>
      </div>
    </div>
  )
}
