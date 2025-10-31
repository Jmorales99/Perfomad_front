import { Navigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { isTokenExpired, removeToken } from '@/infrastructure/storage/tokenStorage'
import { useEffect, useState } from 'react'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth()
  const [isValid, setIsValid] = useState<boolean | null>(null)

  useEffect(() => {
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
  }, [isAuthenticated])

  // Mientras validamos, no renderizamos nada (evita flicker)
  if (isValid === null) return null

  return isValid ? children : <Navigate to="/auth" replace />
}
