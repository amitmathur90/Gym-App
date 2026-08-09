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
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm bg-surface-raised rounded-2xl border border-border shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary to-purple flex items-center justify-center text-2xl">
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
  )
}
