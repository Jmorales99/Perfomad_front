import { useAuth } from "@/app/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { useState } from "react"
import { getAccessToken } from "@/infrastructure/storage/tokenStorage"

export function SubscriptionBanner() {
  const { hasSubscription, setHasSubscription } = useAuth()
  const [loading, setLoading] = useState(false)

  // 🚫 Si el usuario ya tiene suscripción activa, no mostrar nada
  if (hasSubscription) return null

  const handleActivate = async () => {
    try {
      setLoading(true)
      const token = getAccessToken()
      if (!token) throw new Error("Token no disponible")

      await axios.post(
        `${import.meta.env.VITE_API_URL}/v1/subscription/activate-dummy`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setHasSubscription(true)
    } catch (err) {
      console.error("Error al activar suscripción dummy:", err)
      alert("No se pudo activar la suscripción de prueba.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-blue-100 border border-blue-300 rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-blue-800 text-center sm:text-left">
        <p className="font-semibold text-blue-900">Plan inactivo</p>
        <p className="text-sm">
          Tu suscripción aún no está activa. Actívala para desbloquear todas las funcionalidades.
        </p>
      </div>
      <Button
        onClick={handleActivate}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? "Activando..." : "Activar suscripción (dummy)"}
      </Button>
    </div>
  )
}
