import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { getProfile } from "@/infrastructure/api/profileRepository"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Megaphone, Rocket, ImageIcon, Settings, Link2, ArrowRight } from "lucide-react"
import { SubscriptionBanner } from "@/components/SubscriptionBanner"

export default function HomePage() {
  const navigate = useNavigate()
  const [name, setName] = useState<string>("")

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getProfile()
        setName(profile.name)
      } catch (err) {
        console.error("Error al obtener perfil", err)
      }
    }
    fetchProfile()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-100 text-gray-900">
      <main className="flex flex-col items-center grow px-6 py-10 text-center w-full max-w-6xl mx-auto">
        {/* 🧩 Banner de suscripción */}
        <SubscriptionBanner />

        <h2 className="text-4xl font-extrabold mb-3 text-blue-800 drop-shadow-sm">
          ¡Bienvenido, <span className="text-blue-600">{name || "usuario"}</span>! 🎯
        </h2>
        <p className="text-gray-600 mb-12 text-lg max-w-2xl">
          Gestiona tus campañas, creatividades, integraciones y configuración desde un solo lugar.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
          <FeatureCard
            title="Campañas"
            description="Crea, edita y analiza tus campañas publicitarias."
            icon={<Megaphone className="w-8 h-8 text-blue-600" />}
            color="from-blue-500 to-blue-700"
            onClick={() => navigate("/campaigns")}
          />
          <FeatureCard
            title="Optimización"
            description="Mejora el rendimiento de tus anuncios fácilmente."
            icon={<Rocket className="w-8 h-8 text-indigo-600" />}
            color="from-indigo-500 to-indigo-700"
            onClick={() => navigate("/optimization")}
          />
          <FeatureCard
            title="Imágenes"
            description="Centraliza tus creatividades y recursos visuales."
            icon={<ImageIcon className="w-8 h-8 text-blue-600" />}
            color="from-blue-500 to-blue-700"
            onClick={() => navigate("/images")}
          />
          <FeatureCard
            title="Configuración"
            description="Gestiona tu cuenta y tus preferencias personales."
            icon={<Settings className="w-8 h-8 text-blue-700" />}
            color="from-blue-500 to-blue-700"
            onClick={() => navigate("/settings")}
          />
          <FeatureCard
            title="Conectar Cuentas"
            description="Vincula Meta, Google Ads o LinkedIn."
            icon={<Link2 className="w-8 h-8 text-sky-600" />}
            color="from-sky-500 to-blue-600"
            onClick={() => navigate("/integrations")}
          />
        </div>
      </main>

      <footer className="text-center py-4 text-gray-500 text-sm border-t border-blue-200 mt-8 bg-blue-50">
        © {new Date().getFullYear()} Perfomad — Todos los derechos reservados.
      </footer>
    </div>
  )
}

function FeatureCard({
  title,
  description,
  icon,
  color,
  onClick,
}: {
  title: string
  description: string
  icon: React.ReactNode
  color: string
  onClick?: () => void
}) {
  return (
    <Card
      onClick={onClick}
      className="hover:shadow-xl hover:-translate-y-1 transition-all border border-blue-100 bg-white/90 backdrop-blur-sm cursor-pointer"
    >
      <CardHeader className="flex flex-col items-center gap-3">
        <div className="p-3 bg-blue-50 rounded-2xl">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-between text-center px-4">
        <p className="text-gray-600 text-sm mb-6 min-h-[50px]">{description}</p>
        <Button
          onClick={onClick}
          className={`w-full bg-gradient-to-r ${color} text-white hover:opacity-90 flex items-center justify-center gap-2`}
        >
          Ir <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
