// src/infrastructure/api/client.ts
import axios from 'axios'
import {
  getAccessToken,
  removeToken,
  refreshTokenActivity,
  getIsLoggingOut,
} from '@/infrastructure/storage/tokenStorage'
import { toApiError } from '@/infrastructure/api/errors'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ============================================================
// REQUEST INTERCEPTOR — añade Bearer token
// ============================================================

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ============================================================
// RESPONSE INTERCEPTOR — manejo centralizado de errores HTTP
// ============================================================

apiClient.interceptors.response.use(
  (response) => {
    refreshTokenActivity()
    return response
  },
  (error) => {
    const status: number = error.response?.status ?? 0

    if (status === 401) {
      const currentPath = window.location.pathname
      const isPublicPath = ['/', '/auth', '/register'].includes(currentPath)
      if (!getIsLoggingOut()) {
        removeToken()
        if (!isPublicPath) window.location.href = '/auth'
      }
      // Propagar como ApiError tipado
      return Promise.reject(toApiError(error) ?? error)
    }

    if (status === 402 || status === 403) {
      // NO logout. Propagar ApiError tipado para que la UI decida qué mostrar.
      return Promise.reject(toApiError(error) ?? error)
    }

    // Resto de errores: propagar como ApiError si se puede parsear, o el original.
    return Promise.reject(toApiError(error) ?? error)
  }
)
