// src/interface/hooks/useSubscriptionGate.tsx
import React, { useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'

export interface SubscriptionGate {
  /** true si el usuario puede realizar acciones (suscripción activa) */
  canAct: boolean
  /** Abrir modal de paywall */
  openPaywall: () => void
  /** Componente modal de paywall — renderizar en el componente que use el hook */
  PaywallModal: () => React.ReactElement | null
}

export function useSubscriptionGate(): SubscriptionGate {
  const { hasSubscription } = useAuth()
  const [open, setOpen] = useState(false)

  const openPaywall = () => {
    if (!hasSubscription) setOpen(true)
  }

  function PaywallModal() {
    if (!open) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Plan inactivo</h2>
          <p className="text-gray-600 text-sm mb-6">
            Necesitas una suscripción activa para realizar esta acción. Activa tu plan para
            conectar plataformas, sincronizar cuentas, crear y editar campañas.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setOpen(false)
                // Redirect a configuración cuando haya página de pricing real
                window.location.href = '/settings?tab=account'
              }}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              Ver planes
            </button>
          </div>
        </div>
      </div>
    )
  }

  return {
    canAct: hasSubscription,
    openPaywall,
    PaywallModal,
  }
}
