import axios from 'axios'

// The Express backend from ../backend. Override at build/run time with
// VITE_API_BASE_URL if it's not running on localhost:4000.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'

export const api = axios.create({ baseURL: API_BASE_URL })

const TOKEN_KEY = 'gym_staff_access_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error ?? error.message
  }
  return 'Something went wrong'
}
