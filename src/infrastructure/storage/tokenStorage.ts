// src/infrastructure/storage/tokenStorage.ts

/**
 * Sistema centralizado para gestionar el token de autenticación,
 * la expiración por inactividad y el estado de logout.
 */

const ACCESS_TOKEN_KEY = 'access_token'
const LAST_ACTIVITY_KEY = 'last_activity'

let isLoggingOut = false // 👉 Control temporal para evitar redirecciones no deseadas

// ============================================================
// 🧩 TOKEN MANAGEMENT
// ============================================================

/**
 * Guarda el token de acceso en sessionStorage y actualiza la hora de actividad.
 */
export const setAccessToken = (token: string) => {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
  refreshTokenActivity()
}

/**
 * Obtiene el token guardado.
 */
export const getAccessToken = (): string | null => {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

/**
 * Elimina el token y la hora de actividad.
 */
export const removeToken = (): void => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(LAST_ACTIVITY_KEY)
}

// ============================================================
// 🕐 ACTIVITY & EXPIRATION
// ============================================================

/**
 * Actualiza el timestamp de la última actividad.
 */
export const refreshTokenActivity = (): void => {
  sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
}

/**
 * Verifica si el token expiró por inactividad.
 * @param maxHours Tiempo máximo permitido sin actividad (por defecto 1 hora)
 * @returns true si expiró
 */
export const isTokenExpired = (maxHours = 1): boolean => {
  const lastActivity = parseInt(sessionStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10)
  if (!lastActivity) return true // nunca se registró actividad

  const hoursSinceLastActivity = (Date.now() - lastActivity) / (1000 * 60 * 60)
  return hoursSinceLastActivity > maxHours
}

// ============================================================
// 🚪 LOGOUT STATE CONTROL
// ============================================================

/**
 * Marca el estado de logout para evitar redirecciones del interceptor durante el cierre de sesión.
 */
export const markLoggingOut = (value: boolean): void => {
  isLoggingOut = value
}

/**
 * Devuelve si actualmente se está ejecutando un logout.
 */
export const getIsLoggingOut = (): boolean => {
  return isLoggingOut
}
