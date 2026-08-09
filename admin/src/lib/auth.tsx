import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, apiErrorMessage, clearToken, getToken, setToken } from './api'

type Role = 'ADMIN' | 'TRAINER'

interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

interface TrainerSelf {
  id: string // Trainer.id (not the User id) — trainer-scoped endpoints key off this
  userId: string
  specialties: string[]
  user: { id: string; name: string; email: string; avatarUrl: string | null }
}

interface AuthContextValue {
  user: AuthUser | null
  trainer: TrainerSelf | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  login: (email: string, password: string, role: Role) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const ROLE_LABELS: Record<Role, string> = { ADMIN: 'Admin', TRAINER: 'Trainer' }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [trainer, setTrainer] = useState<TrainerSelf | null>(null)
  const [status, setStatus] = useState<AuthContextValue['status']>('loading')

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setStatus('unauthenticated')
      return
    }
    api
      .get('/users/me')
      .then(async (res) => {
        if (res.data.role !== 'ADMIN' && res.data.role !== 'TRAINER') {
          clearToken()
          setStatus('unauthenticated')
          return
        }
        setUser(res.data)
        if (res.data.role === 'TRAINER') {
          const me = await api.get('/trainer/me')
          setTrainer(me.data)
        }
        setStatus('authenticated')
      })
      .catch(() => {
        clearToken()
        setStatus('unauthenticated')
      })
  }, [])

  async function login(email: string, password: string, role: Role) {
    const res = await api.post('/auth/login', { email, password })
    if (res.data.requiresVerification) {
      throw new Error('This account still needs OTP verification — verify it in the member app first.')
    }
    const actualRole = res.data.user.role as Role | string
    if (actualRole !== role) {
      if (actualRole === 'ADMIN' || actualRole === 'TRAINER') {
        throw new Error(`This is a ${ROLE_LABELS[actualRole]} account — switch to the ${ROLE_LABELS[actualRole]} tab to sign in.`)
      }
      throw new Error('This account does not have staff access.')
    }
    setToken(res.data.accessToken)
    setUser(res.data.user)
    if (role === 'TRAINER') {
      const me = await api.get('/trainer/me')
      setTrainer(me.data)
    } else {
      setTrainer(null)
    }
    setStatus('authenticated')
  }

  function logout() {
    clearToken()
    setUser(null)
    setTrainer(null)
    setStatus('unauthenticated')
  }

  return <AuthContext.Provider value={{ user, trainer, status, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { apiErrorMessage }
