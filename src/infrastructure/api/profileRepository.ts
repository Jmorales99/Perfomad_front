import { apiClient } from './client'

export interface Profile {
  id: string
  email: string
  name: string
  age: number
  has_completed_onboarding: boolean
}

/**
 * 🧠 Obtener el perfil del usuario autenticado
 */
export const getProfile = async (): Promise<Profile> => {
  const { data } = await apiClient.get('/v1/profile')
  return data
}

/**
 * ✅ Marcar el onboarding como completado
 */
export const completeOnboarding = async (): Promise<void> => {
  await apiClient.patch('/v1/profile/onboarding')
}
