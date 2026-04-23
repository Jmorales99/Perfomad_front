// src/infrastructure/api/errors.ts

export type ApiErrorCode =
  | 'subscription_required'
  | 'forbidden'
  | 'unauthorized'
  | 'not_found'
  | 'last_brand_forbidden'
  | 'conflict'
  | 'server_error'
  | 'oauth_reconnect_required'
  | 'unknown'

export class ApiError extends Error {
  status: number
  code: ApiErrorCode
  serverMessage?: string
  /** Present when code === 'oauth_reconnect_required' */
  platform?: string
  /** UUID of the ad_account row (Perfomad DB) that needs reconnection */
  adAccountId?: string

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    serverMessage?: string,
    platform?: string,
    adAccountId?: string
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.serverMessage = serverMessage
    this.platform = platform
    this.adAccountId = adAccountId
  }
}

/**
 * Returns true when the error message (or body) indicates the platform token
 * is revoked and the user must re-authorise via OAuth.
 * Used as a heuristic fallback while the backend still returns 500 for some routes.
 */
export function isReconnectError(error: unknown): boolean {
  if (error instanceof ApiError && error.code === 'oauth_reconnect_required') return true

  const msg =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as any).message)
        : ''

  const lower = msg.toLowerCase()
  return (
    lower.includes('invalid_grant') ||
    lower.includes('failed to refresh token') ||
    lower.includes('token has been expired or revoked') ||
    lower.includes('the user must reconnect')
  )
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

  // 422 with code oauth_reconnect_required: platform token revoked.
  // NOT treated as session expiry — the user stays logged in.
  if (status === 422 && body?.code === 'oauth_reconnect_required') {
    return new ApiError(
      422,
      'oauth_reconnect_required',
      serverMessage || 'La conexión con la plataforma publicitaria necesita ser renovada.',
      serverMessage,
      body?.platform,
      body?.ad_account_id
    )
  }

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
