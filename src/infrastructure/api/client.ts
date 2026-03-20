import axios from 'axios'
import { supabase } from '@/infrastructure/supabase/client'
import { toApiError } from '@/infrastructure/api/errors'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ============================================================
// REQUEST INTERCEPTOR — añade Bearer token desde sesión Supabase
// ============================================================

apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// ============================================================
// RESPONSE INTERCEPTOR — manejo centralizado de errores HTTP
// ============================================================

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status: number = error.response?.status ?? 0

    if (status === 401) {
      const currentPath = window.location.pathname
      const isPublicPath = ['/', '/auth', '/register'].includes(currentPath)
      await supabase.auth.signOut()
      if (!isPublicPath) window.location.href = '/auth'
      return Promise.reject(toApiError(error) ?? error)
    }

    if (status === 402 || status === 403) {
      return Promise.reject(toApiError(error) ?? error)
    }

    return Promise.reject(toApiError(error) ?? error)
  }
)
