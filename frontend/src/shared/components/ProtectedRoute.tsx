import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

interface Props {
  children: ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const token = localStorage.getItem('empanadas_admin_token')
  if (!token) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}
