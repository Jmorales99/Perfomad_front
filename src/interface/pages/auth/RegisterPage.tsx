import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/app/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import {
  PhoneInput,
  defaultCountries,
} from "react-international-phone"
import { isValidPhoneNumber } from "libphonenumber-js"
import "react-international-phone/style.css"



export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: "",
    age: "",
    email: "",
    password: "",
    phone: "",
  })

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError(null)
    setSuccessMsg(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    // 🔍 Validaciones
    if (!form.name.trim()) return setError("El nombre es obligatorio.")
    if (!form.age || Number(form.age) < 13)
      return setError("Debes tener al menos 13 años.")
    if (!form.email.includes("@"))
      return setError("Por favor ingresa un correo válido.")
    if (form.password.length < 6)
      return setError("La contraseña debe tener al menos 6 caracteres.")
    if (!form.phone || !isValidPhoneNumber(form.phone))
      return setError("Ingresa un número de teléfono válido.")

    setLoading(true)
    try {
      const success = await register(
        form.email,
        form.password,
        form.name,
        Number(form.age),
        form.phone
      )

      if (success) {
        setSuccessMsg(
          "¡Registro exitoso! Revisa tu correo y confirma tu cuenta antes de iniciar sesión."
        )
        setTimeout(() => navigate("/auth"), 3000)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-blue-50 via-white to-blue-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-blue-200 p-8"
      >
        <h1 className="text-4xl font-extrabold text-blue-700 mb-2 text-center">
          Crear cuenta
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Regístrate para gestionar tus campañas digitales
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            name="name"
            type="text"
            placeholder="Nombre completo"
            value={form.name}
            onChange={handleChange}
          />

          <Input
            name="age"
            type="number"
            placeholder="Edad"
            value={form.age}
            onChange={handleChange}
          />

          <div className="w-full">
            <PhoneInput
              defaultCountry="cl"
              value={form.phone}
              onChange={(phone) => setForm({ ...form, phone })}
              countries={defaultCountries}
              placeholder="Ej: +56976034087"
              inputClassName="w-full rounded-xl border border-blue-200 bg-white p-3 text-base text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>


          <Input
            name="email"
            type="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={handleChange}
          />

          <Input
            name="password"
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
          />

          {/* Mensajes */}
          {error && (
            <p className="text-red-600 text-sm text-center bg-red-50 py-2 rounded-lg">
              {error}
            </p>
          )}

          {successMsg && (
            <p className="text-blue-600 text-sm text-center bg-blue-50 py-2 rounded-lg font-medium">
              {successMsg}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-lg rounded-xl transition-all ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
          >
            {loading ? "Registrando..." : "Registrarse"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/auth"
            className="text-blue-700 hover:underline font-medium"
          >
            ¿Ya tienes cuenta? Inicia sesión
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
