// src/infrastructure/repositories/clientsRepository.ts
import { apiClient } from '@/infrastructure/api/client'

export interface Client {
  id: string
  name: string
  description?: string
  created_at?: string
}

/**
 * GET /v1/clients — lista todas las empresas internas del usuario.
 */
export const listClients = async (): Promise<Client[]> => {
  const { data } = await apiClient.get('/v1/clients')
  // El backend puede devolver array directo o { clients: [] }
  return Array.isArray(data) ? data : (data.clients ?? [])
}

/**
 * GET /v1/clients/:id — obtiene una empresa por ID.
 */
export const getClient = async (id: string): Promise<Client> => {
  const { data } = await apiClient.get(`/v1/clients/${id}`)
  return data
}

/**
 * POST /v1/clients — crea una nueva empresa interna.
 */
export const createClient = async (payload: {
  name: string
  description?: string
}): Promise<Client> => {
  const { data } = await apiClient.post('/v1/clients', payload)
  return data
}

/**
 * DELETE /v1/clients/:id — elimina una marca.
 * Puede devolver 204 (OK) o 409 { code: "last_brand_forbidden" } si es la última.
 */
export const deleteClient = async (id: string): Promise<void> => {
  await apiClient.delete(`/v1/clients/${id}`)
}
