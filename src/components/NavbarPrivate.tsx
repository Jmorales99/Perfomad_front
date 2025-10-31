import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/providers/AuthProvider"
import { useEffect, useState } from "react"
import { getProfile } from "@/infrastructure/api/profileRepository"
import clsx from "clsx"

export function NavbarPrivate() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
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

  const handleLogout = () => {
    logout()
    setTimeout(() => navigate("/"), 0)
  }

  // 🔹 Función auxiliar para saber si la ruta actual coincide
  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-sm border-b border-blue-100">
      {/* Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/home")}>
        <img src="/logo.svg" alt="Perfomad" className="w-8 h-8" />
        <h1 className="text-xl font-bold text-blue-700 tracking-tight">Perfomad</h1>
      </div>

      {/* Links principales */}
      <ul className="hidden md:flex gap-6 font-medium text-gray-700">
        <li
          onClick={() => navigate("/campaigns")}
          className={clsx(
            "cursor-pointer transition hover:text-blue-600",
            isActive("/campaigns") && "text-blue-700 font-semibold underline underline-offset-4"
          )}
        >
          Campañas
        </li>
        <li
          onClick={() => navigate("/optimization")}
          className={clsx(
            "cursor-pointer transition hover:text-blue-600",
            isActive("/optimization") && "text-blue-700 font-semibold underline underline-offset-4"
          )}
        >
          Optimización
        </li>
        <li
          onClick={() => navigate("/images")}
          className={clsx(
            "cursor-pointer transition hover:text-blue-600",
            isActive("/images") && "text-blue-700 font-semibold underline underline-offset-4"
          )}
        >
          Sube tus imágenes
        </li>
        <li
          onClick={() => navigate("/settings")}
          className={clsx(
            "cursor-pointer transition hover:text-blue-600",
            isActive("/settings") && "text-blue-700 font-semibold underline underline-offset-4"
          )}
        >
          Configuración
        </li>
      </ul>

      {/* Menú usuario */}
      <div className="relative group">
        <Button
          variant="outline"
          className="flex items-center gap-2 px-4 py-2 font-medium border-gray-300 text-gray-800 hover:bg-blue-50 hover:text-blue-700"
        >
          {name || "Usuario"}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>

        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={() => navigate("/profile")}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
          >
            Perfil
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
          >
            Configuración
          </button>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  )
}
