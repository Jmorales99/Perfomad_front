import { useAuth } from "@/app/providers/AuthProvider"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { getProfile } from "@/infrastructure/api/profileRepository"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

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
      {/* Contenido principal */}
      <main className="flex flex-col items-center justify-center grow px-6 text-center">
        <h2 className="text-4xl font-extrabold mb-3 text-blue-800 drop-shadow-sm">
          ¡Bienvenido, <span className="text-blue-600">{name || "usuario"}</span>! 🎯
        </h2>
        <p className="text-lg text-gray-600 mb-10">
          Gestiona tus cuentas, campañas y optimizaciones desde aquí.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
          <FeatureCard
            title="Campañas"
            color="from-blue-500 to-blue-700"
            description="Crea, edita y analiza tus campañas publicitarias."
            onClick={() => navigate("/campaigns")}
          />
          <FeatureCard
            title="Optimización"
            color="from-indigo-500 to-indigo-700"
            description="Mejora el rendimiento de tus anuncios fácilmente."
          />
          <FeatureCard
            title="Sube tus Imágenes"
            color="from-blue-500 to-blue-700"
            description="Centraliza tus creatividades para todas las plataformas."
            onClick={() => navigate("/images")}
          />
          <FeatureCard
            title="Configuración"
            color="from-blue-500 to-blue-700"
            description="Ajusta la información de tu cuenta y tus integraciones."
            onClick={() => navigate("/settings")}
          />
          <FeatureCard
            title="Conectar cuentas"
            color="from-sky-500 to-blue-600"
            description="Vincula Meta, Google Ads o LinkedIn para sincronizar tus datos y campañas."
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
  color,
  onClick,
}: {
  title: string
  description: string
  color: string
  onClick?: () => void
}) {
  return (
    <Card className="hover:shadow-lg hover:-translate-y-1 transition-all border border-blue-100 bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm mb-4">{description}</p>
        <Button
          onClick={onClick}
          className={`w-full bg-gradient-to-r ${color} text-white hover:opacity-90 transition`}
        >
          Ir
        </Button>
      </CardContent>
    </Card>
  )
}
