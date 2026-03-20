import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/home'
    return <Navigate to={from} replace />
  }

  return children
}
