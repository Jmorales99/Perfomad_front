// src/infrastructure/api/client.ts
import axios from 'axios'
import {
  getAccessToken,
  removeToken,
  refreshTokenActivity,
  getIsLoggingOut,
} from '@/infrastructure/storage/tokenStorage'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ============================================================
// 📤 REQUEST INTERCEPTOR
// ============================================================

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ============================================================
// 📥 RESPONSE INTERCEPTOR
// ============================================================

apiClient.interceptors.response.use(
  (response) => {
    // 🕒 Si hubo respuesta exitosa, refrescar timestamp de actividad
    refreshTokenActivity()
    return response
  },
  (error) => {
    // ⚠️ Si el backend responde 401 (token inválido o expirado)
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      const isPublicPath = ['/', '/auth', '/register'].includes(currentPath)

      // Evitar redirigir si el usuario está cerrando sesión manualmente
      if (!getIsLoggingOut()) {
        removeToken()
        if (!isPublicPath) window.location.href = '/auth'
      }
    }

    return Promise.reject(error)
  }
)
