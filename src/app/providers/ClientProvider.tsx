// src/app/providers/ClientProvider.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  listClients,
  createClient,
  deleteClient,
  type Client,
} from '@/infrastructure/repositories/clientsRepository'
import { useAuth } from '@/app/providers/AuthProvider'

const STORAGE_KEY = 'selectedClientId'

export interface MetaIntegrationStatus {
  connected: boolean
  accountCount: number
  lastSync: string | null
}

interface ClientContextType {
  clients: Client[]
  selectedClientId: string | null
  selectedClient: Client | null
  loadingClients: boolean
  setSelectedClientId: (id: string) => void
  loadClients: () => Promise<void>
  createAndSelectClient: (name: string, description?: string) => Promise<Client>
  /** Elimina una marca; si era la activa, selecciona otra automáticamente. */
  removeClient: (id: string) => Promise<void>
  // Estado de integración Meta por clientId (en memoria, se resetea al recargar)
  metaStatus: Record<string, MetaIntegrationStatus>
  setMetaStatus: (clientId: string, status: MetaIntegrationStatus) => void
}

const ClientContext = createContext<ClientContextType | null>(null)

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientIdState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  )
  const [loadingClients, setLoadingClients] = useState(false)
  const [metaStatus, setMetaStatusMap] = useState<Record<string, MetaIntegrationStatus>>({})

  const setMetaStatus = (clientId: string, status: MetaIntegrationStatus) => {
    setMetaStatusMap((prev) => ({ ...prev, [clientId]: status }))
  }

  const setSelectedClientId = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id)
    setSelectedClientIdState(id)
  }

  const loadClients = useCallback(async () => {
    setLoadingClients(true)
    try {
      const data = await listClients()
      setClients(data)

      // Selección automática: si el guardado no existe en la lista, elegir Default o primero
      const stored = localStorage.getItem(STORAGE_KEY)
      const storedExists = stored && data.some((c) => c.id === stored)

      if (!storedExists && data.length > 0) {
        const defaultClient =
          data.find((c) => c.name.toLowerCase() === 'default') ?? data[0]
        setSelectedClientId(defaultClient.id)
      }
    } catch {
      // Si falla (ej. sin suscripción), no bloquear la app
    } finally {
      setLoadingClients(false)
    }
  }, [])

  // Cargar clients cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated) {
      loadClients()
    } else {
      setClients([])
    }
  }, [isAuthenticated, loadClients])

  const createAndSelectClient = async (
    name: string,
    description?: string
  ): Promise<Client> => {
    const client = await createClient({ name, description })
    setClients((prev) => [...prev, client])
    setSelectedClientId(client.id)
    return client
  }

  const removeClient = async (id: string): Promise<void> => {
    await deleteClient(id)
    setClients((prev) => {
      const remaining = prev.filter((c) => c.id !== id)
      // Si se borró la marca activa, seleccionar Default o la primera restante
      if (id === selectedClientId && remaining.length > 0) {
        const next =
          remaining.find((c) => c.name.toLowerCase() === 'default') ?? remaining[0]
        setSelectedClientId(next.id)
      }
      return remaining
    })
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null

  return (
    <ClientContext.Provider
      value={{
        clients,
        selectedClientId,
        selectedClient,
        loadingClients,
        setSelectedClientId,
        loadClients,
        createAndSelectClient,
        removeClient,
        metaStatus,
        setMetaStatus,
      }}
    >
      {children}
    </ClientContext.Provider>
  )
}

export function useClient() {
  const ctx = useContext(ClientContext)
  if (!ctx) throw new Error('useClient must be used within ClientProvider')
  return ctx
}
