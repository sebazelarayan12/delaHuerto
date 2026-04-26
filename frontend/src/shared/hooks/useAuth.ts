import { useState } from 'react'
import { api } from '../../api/axios'

const TOKEN_KEY = 'empanadas_admin_token'

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))

  const login = async (username: string, password: string) => {
    const res = await api.post<{ token: string }>('/api/auth/login', { username, password })
    const t = res.data.token
    localStorage.setItem(TOKEN_KEY, t)
    setToken(t)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }

  return { token, isAuthenticated: !!token, login, logout }
}
