// src/infrastructure/api/errors.ts

export type ApiErrorCode =
  | 'subscription_required'
  | 'forbidden'
  | 'unauthorized'
  | 'not_found'
  | 'last_brand_forbidden'
  | 'conflict'
  | 'server_error'
  | 'unknown'

export class ApiError extends Error {
  status: number
  code: ApiErrorCode
  serverMessage?: string

  constructor(status: number, code: ApiErrorCode, message: string, serverMessage?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.serverMessage = serverMessage
  }
}

/**
 * Convierte un error de Axios en un ApiError tipado.
 * Retorna null si el error no es una respuesta HTTP (ej. red caída).
 */
export function toApiError(error: unknown): ApiError | null {
  if (!isAxiosLikeError(error)) return null

  const status: number = error.response?.status ?? 0
  const body = error.response?.data ?? {}
  const serverMessage: string = body?.message ?? body?.error ?? ''

  switch (status) {
    case 401:
      return new ApiError(401, 'unauthorized', 'No autorizado', serverMessage)
    case 402:
      return new ApiError(
        402,
        'subscription_required',
        'Se requiere una suscripción activa para realizar esta acción.',
        serverMessage
      )
    case 403:
      return new ApiError(403, 'forbidden', 'No tienes permiso para esta acción.', serverMessage)
    case 404:
      return new ApiError(404, 'not_found', 'Recurso no encontrado.', serverMessage)
    case 409: {
      const code: ApiErrorCode =
        body?.code === 'last_brand_forbidden' ? 'last_brand_forbidden' : 'conflict'
      const msg =
        code === 'last_brand_forbidden'
          ? 'No puedes eliminar la última marca. Crea otra antes de borrar esta.'
          : serverMessage || 'Conflicto al procesar la solicitud.'
      return new ApiError(409, code, msg, serverMessage)
    }
    default:
      if (status >= 500) {
        return new ApiError(status, 'server_error', 'Error interno del servidor.', serverMessage)
      }
      return new ApiError(status, 'unknown', serverMessage || 'Error desconocido.', serverMessage)
  }
}

/**
 * Devuelve true si el error tiene la forma de un error de respuesta HTTP de Axios.
 */
function isAxiosLikeError(
  error: unknown
): error is { response?: { status: number; data?: any } } {
  return typeof error === 'object' && error !== null && 'response' in error
}
