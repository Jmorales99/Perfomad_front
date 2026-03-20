import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/app/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { ArrowLeft, BarChart2, Layers, Users } from "lucide-react"

const COUNTRY_CODES = [
  { dial: "+56", flag: "🇨🇱", name: "Chile" },
  { dial: "+54", flag: "🇦🇷", name: "Argentina" },
  { dial: "+52", flag: "🇲🇽", name: "México" },
  { dial: "+57", flag: "🇨🇴", name: "Colombia" },
  { dial: "+51", flag: "🇵🇪", name: "Perú" },
  { dial: "+55", flag: "🇧🇷", name: "Brasil" },
  { dial: "+598", flag: "🇺🇾", name: "Uruguay" },
  { dial: "+593", flag: "🇪🇨", name: "Ecuador" },
  { dial: "+58", flag: "🇻🇪", name: "Venezuela" },
  { dial: "+34", flag: "🇪🇸", name: "España" },
  { dial: "+1", flag: "🇺🇸", name: "EE.UU." },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: "",
    age: "",
    email: "",
    password: "",
    phoneLocal: "",
  })
  const [dialCode, setDialCode] = useState("+56")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError(null)
    setSuccessMsg(null)
  }

  const fullPhone = `${dialCode}${form.phoneLocal.replace(/\D/g, "")}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!form.name.trim()) return setError("El nombre es obligatorio.")
    if (!form.age || Number(form.age) < 13)
      return setError("Debes tener al menos 13 años.")
    if (!form.email.includes("@"))
      return setError("Por favor ingresa un correo válido.")
    if (form.password.length < 6)
      return setError("La contraseña debe tener al menos 6 caracteres.")
    if (!form.phoneLocal.trim())
      return setError("Ingresa un número de teléfono.")

    setLoading(true)
    const result = await register(
      form.email,
      form.password,
      form.name,
      Number(form.age),
      fullPhone
    )
    setLoading(false)

    if (result.success) {
      setSuccessMsg(
        "¡Registro exitoso! Revisa tu correo y confirma tu cuenta antes de iniciar sesión."
      )
      setTimeout(() => navigate("/auth"), 3000)
    } else {
      setError(result.error ?? "Error al registrar usuario.")
    }
  }

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row lg:h-dvh lg:overflow-hidden">
      {/* Columna izquierda — solo desktop */}
      <div className="hidden lg:flex lg:w-1/2 lg:min-h-0 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-center px-10 py-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 max-w-lg"
        >
          <div>
            <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
              Toda tu publicidad digital,
              <br />
              en un solo lugar
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Centraliza el rendimiento de tus campañas en Meta, Google Ads,
              LinkedIn y TikTok desde un único panel.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { icon: Layers, text: "Centralización de datos de todas tus plataformas" },
              { icon: BarChart2, text: "Visualización clara del rendimiento de campañas" },
              { icon: Users, text: "Gestión de múltiples clientes y cuentas" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-blue-100 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Formulario */}
      <div className="flex-1 flex flex-col min-h-0 lg:min-h-0 items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 lg:bg-white lg:bg-none px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm flex flex-col min-h-0"
        >
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2 h-9 w-fit px-2 text-gray-600 hover:text-blue-700 self-start"
            asChild
          >
            <Link to="/" className="inline-flex items-center gap-1.5 font-medium">
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Volver al inicio
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Crear cuenta
          </h1>
          <p className="text-gray-500 text-sm mb-5">
            Regístrate para gestionar tus campañas digitales
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Nombre + Edad */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nombre
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Juan Pérez"
                  value={form.name}
                  onChange={handleChange}
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 h-10 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="age" className="text-sm font-medium text-gray-700">
                  Edad
                </Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  placeholder="25"
                  value={form.age}
                  onChange={handleChange}
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 h-10 text-sm"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-700">
                Teléfono
              </Label>
              <div className="flex rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                <select
                  value={dialCode}
                  onChange={(e) => {
                    setDialCode(e.target.value)
                    setError(null)
                  }}
                  className="bg-white border-r border-gray-200 text-sm text-gray-700 h-10 outline-none cursor-pointer px-2 shrink-0"
                >
                  {COUNTRY_CODES.map(({ dial, flag, name }) => (
                    <option key={`${dial}-${name}`} value={dial}>
                      {flag} {dial}
                    </option>
                  ))}
                </select>
                <Input
                  name="phoneLocal"
                  type="tel"
                  placeholder="9 1234 5678"
                  value={form.phoneLocal}
                  onChange={handleChange}
                  className="flex-1 border-0 rounded-none shadow-none focus-visible:ring-0 h-10 text-sm px-3"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Correo electrónico
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nombre@empresa.com"
                value={form.email}
                onChange={handleChange}
                className="rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 h-10 text-sm"
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Contraseña
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
                className="rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 h-10 text-sm"
              />
            </div>

            {error && (
              <p className="text-red-600 text-xs text-center bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}

            {successMsg && (
              <p className="text-blue-700 text-xs text-center bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl font-medium">
                {successMsg}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className={`w-full h-10 text-sm rounded-xl transition-all mt-1 ${
                loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              {loading ? "Registrando..." : "Crear cuenta"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link to="/auth" className="text-blue-700 hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
