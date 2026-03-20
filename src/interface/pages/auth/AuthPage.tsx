import { useState, useEffect } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { useAuth } from "@/app/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"

export default function AuthPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
    const result = await login(email, password)
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? "Error al iniciar sesión.")
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-blue-200 p-8"
      >
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 h-9 px-2 text-gray-600 hover:text-blue-700"
          asChild
        >
          <Link to="/" className="inline-flex items-center gap-1.5 font-medium">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Volver al inicio
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">
          Iniciar sesión
        </h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          Accede a tu panel de campañas digitales
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="nombre@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border-blue-200 focus:ring-2 focus:ring-blue-500 h-11"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border-blue-200 focus:ring-2 focus:ring-blue-500 h-11"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center bg-red-50 border border-red-200 p-3 rounded-xl">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className={`w-full h-11 text-base rounded-xl transition-all ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </form>

        <div className="mt-5 text-center">
          <Link
            to="/register"
            className="text-blue-700 hover:underline font-medium text-sm"
          >
            ¿No tienes cuenta? Crear una
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
