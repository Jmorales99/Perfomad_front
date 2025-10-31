import { Navigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { isTokenExpired, removeToken } from '@/infrastructure/storage/tokenStorage'
import { useEffect, useState } from 'react'

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth()
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null)

  useEffect(() => {
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

    // Si sigue autenticado y el token está vigente → redirigir al home
    setIsAllowed(false)
  }, [isAuthenticated])

  if (isAllowed === null) return null

  return isAllowed ? children : <Navigate to="/home" replace />
}
