import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/app/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  BarChart2,
  Layers,
  LineChart,
  Settings2,
  Users,
  Mail,
  ArrowRight,
  TrendingUp,
} from "lucide-react"

const features = [
  {
    icon: Layers,
    title: "Centralización de datos",
    description:
      "Consolida la información de todas tus plataformas publicitarias en un único panel. Sin cambiar de pestaña.",
  },
  {
    icon: BarChart2,
    title: "Visualización del rendimiento",
    description:
      "Accede a métricas claras y comparativas para entender qué campañas funcionan y cuáles no.",
  },
  {
    icon: Settings2,
    title: "Gestión multiplataforma",
    description:
      "Administra cuentas de Meta, Google Ads, LinkedIn y TikTok desde un solo lugar.",
  },
  {
    icon: LineChart,
    title: "Métricas clave",
    description:
      "Seguimiento de inversión, impresiones, clics, conversiones y más, sin configuraciones complicadas.",
  },
  {
    icon: Users,
    title: "Escalabilidad para agencias",
    description:
      "Gestiona múltiples clientes y cuentas publicitarias con una estructura ordenada y escalable.",
  },
]

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate("/home")
  }, [isAuthenticated, navigate])

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-blue-700 tracking-tight">
            Perfomad
          </span>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2 text-sm"
          >
            Ingresar
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-50 via-white to-blue-100 py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-xs font-semibold text-blue-600 uppercase tracking-widest mb-4 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                Plataforma de gestión publicitaria
              </span>
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
                Toda tu publicidad digital,{" "}
                <span className="text-blue-600">en un solo lugar</span>
              </h1>
              <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Perfomad centraliza el rendimiento de tus campañas en Meta,
                Google Ads, LinkedIn y TikTok para que puedas tomar decisiones
                con información real, sin perder tiempo saltando entre
                plataformas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base rounded-xl flex items-center gap-2"
                >
                  Ingresar a la plataforma
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-blue-700 px-8 py-3 text-base rounded-xl"
                  onClick={() =>
                    (window.location.href = "mailto:admin@performad.io")
                  }
                >
                  Contactar
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Qué hacemos */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                ¿Qué hace Perfomad?
              </h2>
              <p className="text-gray-600 text-base leading-relaxed max-w-3xl mx-auto">
                Perfomad es una plataforma diseñada para agencias y equipos de
                marketing que gestionan campañas en múltiples canales
                publicitarios. Permite consolidar datos de distintas fuentes,
                visualizar el rendimiento de cada cuenta y facilitar la gestión
                de clientes e integraciones, todo desde un panel unificado.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {[
                {
                  icon: TrendingUp,
                  label: "Análisis consolidado",
                  desc: "Todas las métricas en un solo dashboard",
                },
                {
                  icon: Layers,
                  label: "Múltiples plataformas",
                  desc: "Meta, Google Ads, LinkedIn y TikTok",
                },
                {
                  icon: Users,
                  label: "Gestión de clientes",
                  desc: "Cuentas y marcas organizadas por cliente",
                },
              ].map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 p-6 rounded-xl bg-blue-50 border border-blue-100"
                >
                  <Icon className="w-7 h-7 text-blue-600 mb-1" />
                  <p className="font-semibold text-gray-800 text-sm">{label}</p>
                  <p className="text-gray-500 text-xs">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-14"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Por qué usar Perfomad
              </h2>
              <p className="text-gray-500 text-sm">
                Funcionalidades diseñadas para simplificar el trabajo diario de
                equipos publicitarios.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map(({ icon: Icon, title, description }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-sm p-6 flex flex-col gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {title}
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Propuesta de valor */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-blue-50 border border-blue-100 rounded-2xl p-10 text-center"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Menos tiempo administrando, más tiempo optimizando
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xl mx-auto">
                Perfomad elimina la necesidad de acceder a cada plataforma por
                separado para revisar resultados. Toda la información relevante
                de tus campañas está disponible en un panel claro, accesible y
                actualizado.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contacto */}
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                ¿Tienes preguntas?
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Escríbenos directamente y te respondemos a la brevedad.
              </p>
              <p className="text-blue-700 font-semibold text-sm mb-6">
                admin@performad.io
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2"
                onClick={() =>
                  (window.location.href = "mailto:admin@performad.io")
                }
              >
                Enviar mensaje
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span>
            © {new Date().getFullYear()}{" "}
            <span className="font-semibold text-blue-700">Perfomad</span>
          </span>
          <span>admin@performad.io</span>
          <button
            onClick={() => navigate("/auth")}
            className="text-blue-600 hover:underline font-medium"
          >
            Ingresar
          </button>
        </div>
      </footer>
    </div>
  )
}
