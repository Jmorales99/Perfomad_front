import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { isTokenExpired, removeToken } from '@/infrastructure/storage/tokenStorage'
import { useEffect, useState } from 'react'

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, logout } = useAuth()
  const location = useLocation()
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    // Wait for auth loading to complete before making decisions
    if (loading) {
      setIsAllowed(null)
      return
    }

    if (!isAuthenticated) {
      setIsAllowed(true)
      return
    }

    // Si la sesión expiró, cerramos y permitimos acceso al login
    if (isTokenExpired(1)) {
      removeToken()
      logout()
      setIsAllowed(true)
      return
    }

    // Si sigue autenticado y el token está vigente → redirigir
    // Try to redirect to the original intended location, or default to home
    setIsAllowed(false)
  }, [isAuthenticated, loading, logout])

  if (loading || isAllowed === null) return null

  // If authenticated and trying to access public route, redirect to home or previous location
  if (!isAllowed) {
    // Check if there's a 'from' location in state (from ProtectedRoute redirect)
    const from = location.state?.from?.pathname || '/home'
    return <Navigate to={from} replace />
  }

  return children
}
