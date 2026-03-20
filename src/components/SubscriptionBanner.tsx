import { useAuth } from "@/app/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export function SubscriptionBanner() {
  const { hasSubscription } = useAuth()
  const navigate = useNavigate()

  if (hasSubscription) return null

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-amber-800 text-center sm:text-left">
        <p className="font-semibold text-amber-900">Plan inactivo</p>
        <p className="text-sm">
          Puedes ver tus datos existentes, pero conectar plataformas y gestionar campañas requiere
          una suscripción activa.
        </p>
      </div>
      <Button
        onClick={() => navigate("/settings?tab=account")}
        className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
      >
        Ver planes
      </Button>
    </div>
  )
}
