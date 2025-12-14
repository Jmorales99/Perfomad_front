import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { isTokenExpired, removeToken } from '@/infrastructure/storage/tokenStorage'
import { useEffect, useState } from 'react'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, logout } = useAuth()
  const location = useLocation()
  const [isValid, setIsValid] = useState<boolean | null>(null)

  useEffect(() => {
    // Wait for auth loading to complete before making decisions
    if (loading) {
      setIsValid(null)
      return
    }

    // Si no está autenticado, salimos
    if (!isAuthenticated) {
      setIsValid(false)
      return
    }

    // Si el token expiró (por inactividad), cerramos sesión
    if (isTokenExpired(1)) {
      removeToken()
      logout()
      setIsValid(false)
      return
    }

    // Token válido
    setIsValid(true)
  }, [isAuthenticated, loading, logout])

  // Mientras validamos (loading o isValid null), no renderizamos nada (evita flicker)
  if (loading || isValid === null) return null

  // Preserve the current location when redirecting to login
  return isValid ? children : <Navigate to="/auth" state={{ from: location }} replace />
}
