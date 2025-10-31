import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/app/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate("/home")
  }, [isAuthenticated, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full p-10 rounded-3xl bg-white/70 backdrop-blur-md shadow-xl border border-blue-200"
      >
        <h1 className="text-6xl font-extrabold text-blue-700 mb-6 tracking-tight">
          Perfomad
        </h1>

        <p className="text-lg text-gray-700 mb-10 leading-relaxed">
          Optimiza tus{" "}
          <span className="font-semibold text-blue-600">
            campañas digitales
          </span>{" "}
          y mejora tu rendimiento con{" "}
          <span className="font-semibold text-gray-800">Meta</span>,{" "}
          <span className="font-semibold text-gray-800">Google Ads</span> y{" "}
          <span className="font-semibold text-gray-800">LinkedIn</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate("/auth")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg rounded-xl"
          >
            Iniciar sesión
          </Button>
          <Button
            className="bg-white text-blue-700 border border-blue-600 hover:bg-blue-50 px-6 py-3 text-lg rounded-xl"
            onClick={() => navigate("/register")}
          >
            Crear cuenta
          </Button>
        </div>
      </motion.div>

      <footer className="mt-16 text-gray-500 text-sm">
        © {new Date().getFullYear()}{" "}
        <span className="font-medium text-blue-700">Perfomad</span> — Impulsa
        tu rendimiento digital 🚀
      </footer>
    </div>
  )
}
