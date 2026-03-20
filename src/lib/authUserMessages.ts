/**
 * Mensajes de autenticación para el usuario final (español, sin detalles técnicos).
 */

/** Errores típicos de supabase.auth.signInWithPassword */
export function mapSupabaseSignInError(message: string): string {
  const lower = message.toLowerCase().trim()

  if (
    lower === "invalid login credentials" ||
    lower.includes("invalid login credentials")
  ) {
    return "Correo o contraseña incorrectos."
  }
  if (lower.includes("email not confirmed")) {
    return "Debes confirmar tu correo antes de iniciar sesión."
  }
  if (lower.includes("too many requests") || lower.includes("rate limit")) {
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo."
  }
  if (
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("failed to fetch")
  ) {
    return "No hay conexión. Revisa tu internet e inténtalo de nuevo."
  }

  return "No pudimos iniciar sesión. Inténtalo de nuevo en unos minutos."
}

export const PROFILE_LOAD_USER_ERROR =
  "No pudimos cargar tu cuenta. Comprueba tu conexión e inténtalo de nuevo."

const REGISTER_CODES = {
  USER_ALREADY_EXISTS: "Ya existe una cuenta con ese correo.",
  VALIDATION_FAILED: "Revisa los datos del formulario e inténtalo de nuevo.",
  NETWORK_ERROR:
    "No pudimos conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.",
  SERVER_ERROR:
    "El servicio no está disponible en este momento. Inténtalo más tarde.",
  REGISTER_FAILED: "No pudimos completar el registro. Inténtalo de nuevo.",
} as const

/**
 * Errores de registro vía API (códigos internos o mensajes heredados).
 */
export function mapRegisterApiError(error: unknown): string {
  if (!(error instanceof Error)) {
    return REGISTER_CODES.REGISTER_FAILED
  }

  const code = error.message as keyof typeof REGISTER_CODES
  if (code in REGISTER_CODES) {
    return REGISTER_CODES[code]
  }

  const msg = error.message.toLowerCase()

  if (
    msg.includes("usuario ya existe") ||
    msg.includes("already registered") ||
    msg.includes("already exists") ||
    msg.includes("duplicate") ||
    msg.includes("unique constraint")
  ) {
    return REGISTER_CODES.USER_ALREADY_EXISTS
  }
  if (msg.includes("no se pudo conectar") || msg.includes("conectar con el servidor")) {
    return REGISTER_CODES.NETWORK_ERROR
  }
  if (msg.includes("datos inválidos") || msg.includes("solicitud inválida")) {
    return REGISTER_CODES.VALIDATION_FAILED
  }

  return REGISTER_CODES.REGISTER_FAILED
}
