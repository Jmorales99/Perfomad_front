// src/infrastructure/api/authRepository.ts
import { apiClient } from "./client"

/**
 * 🔐 Iniciar sesión
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<string> => {
  try {
    const response = await apiClient.post("/v1/auth/login", { email, password })
    const token = response.data?.access_token

    if (!token) {
      throw new Error("No se recibió token de autenticación.")
    }

    return token
  } catch (error: any) {
    if (error.response) {
      // 👇 Preferimos usar el mensaje del backend si viene
      const backendError =
        error.response.data?.error || error.response.data?.message
      if (backendError) throw new Error(backendError)

      // Fallbacks por tipo de status
      if (error.response.status === 401) {
        throw new Error(
          "Credenciales inválidas. Verifica tu correo y contraseña."
        )
      } else if (error.response.status === 400) {
        throw new Error("Solicitud inválida. Revisa los datos ingresados.")
      } else {
        throw new Error("Error en el servidor.")
      }
    } else if (error.request) {
      throw new Error("No se pudo conectar con el servidor. Intenta más tarde.")
    } else {
      throw new Error("Error desconocido al iniciar sesión.")
    }
  }
}

/**
 * 🧾 Registrar usuario con datos adicionales
 * (email, password, name, age, phone)
 */
export const registerUser = async (
  email: string,
  password: string,
  name: string,
  age: number,
  phone: string
): Promise<void> => {
  try {
    await apiClient.post('/v1/auth/signup', { email, password, name, age, phone })
  } catch (error: any) {
    if (error.response) {
      const backendError = error.response.data?.error || error.response.data?.message
      if (backendError) throw new Error(backendError)

      if (error.response.status === 409) {
        throw new Error('El usuario ya existe.')
      } else if (error.response.status === 400) {
        throw new Error('Datos inválidos. Verifica los campos.')
      } else {
        throw new Error('Error al registrar usuario.')
      }
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Intenta nuevamente.')
    } else {
      throw new Error('Error desconocido al registrar.')
    }
  }
}