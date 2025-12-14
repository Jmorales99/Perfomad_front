import { useState, useEffect } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { useAuth } from "@/app/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function AuthPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // If already authenticated, redirect to intended destination or home
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/home"
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const success = await login(email, password)
    setLoading(false)
    if (success) {
      // Redirect to the originally intended location, or default to home
      const from = location.state?.from?.pathname || "/home"
      navigate(from, { replace: true })
    } else {
      setError("Credenciales incorrectas, intenta nuevamente.")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-blue-200 p-8"
      >
        <h1 className="text-4xl font-extrabold text-blue-700 mb-2 text-center">
          Perfomad
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Accede a tu panel de campañas digitales
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />

          {error && (
            <p className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-lg">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 text-lg rounded-xl transition-all"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/register"
            className="text-blue-700 hover:underline font-medium"
          >
            ¿No tienes cuenta? Crear una
          </Link>
        </div>
      </motion.div>

      <footer className="mt-8 text-gray-500 text-sm">
        © {new Date().getFullYear()}{" "}
        <span className="font-medium text-blue-700">Perfomad</span>
      </footer>
    </div>
  )
}
