import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

interface Props {
  children: ReactNode
}

function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && payload.exp > Date.now() / 1000
  } catch {
    return false
  }
}

export default function ProtectedRoute({ children }: Props) {
  const token = localStorage.getItem('empanadas_admin_token')
  if (!token || !isTokenValid(token)) {
    localStorage.removeItem('empanadas_admin_token')
    return <Navigate to="/admin/login" replace />
  }
  return <>{children}</>
}
