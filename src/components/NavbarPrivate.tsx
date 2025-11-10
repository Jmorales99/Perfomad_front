import { useNavigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import clsx from "clsx"

import { useAuth } from "@/app/providers/AuthProvider"
import { getProfile } from "@/infrastructure/api/profileRepository"

// shadcn/ui
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

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
    // pequeño defer para evitar race con navegación protegida
    setTimeout(() => navigate("/"), 0)
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-sm border-b border-blue-100">
      {/* Logo */}
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => navigate("/home")}
      >
        <img src="/logo.svg" alt="Perfomad" className="w-8 h-8" />
        <h1 className="text-xl font-bold text-blue-700 tracking-tight">
          Perfomad
        </h1>
      </div>

      {/* Links */}
      <ul className="hidden md:flex gap-6 font-medium text-gray-700">
        <li
          onClick={() => navigate("/campaigns")}
          className={clsx(
            "cursor-pointer transition hover:text-blue-600",
            isActive("/campaigns") &&
              "text-blue-700 font-semibold underline underline-offset-4"
          )}
        >
          Campañas
        </li>
        <li
          onClick={() => navigate("/optimization")}
          className={clsx(
            "cursor-pointer transition hover:text-blue-600",
            isActive("/optimization") &&
              "text-blue-700 font-semibold underline underline-offset-4"
          )}
        >
          Optimización
        </li>
        <li
          onClick={() => navigate("/images")}
          className={clsx(
            "cursor-pointer transition hover:text-blue-600",
            isActive("/images") &&
              "text-blue-700 font-semibold underline underline-offset-4"
          )}
        >
          Sube tus imágenes
        </li>
        <li
          onClick={() => navigate("/settings")}
          className={clsx(
            "cursor-pointer transition hover:text-blue-600",
            isActive("/settings") &&
              "text-blue-700 font-semibold underline underline-offset-4"
          )}
        >
          Configuración
        </li>
      </ul>

      {/* Menú de usuario (Radix) */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2 px-4 py-2 font-medium border-gray-300 text-gray-800 hover:bg-blue-50 hover:text-blue-700"
          >
            {name || "Usuario"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </DropdownMenuTrigger>

        {/* Usa portal + collision handling por defecto */}
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-52 rounded-xl border border-gray-200 bg-white/95 backdrop-blur-md shadow-xl"
        >
          <DropdownMenuLabel className="text-gray-500">
            Cuenta
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              navigate("/profile")
            }}
            className="cursor-pointer"
          >
            Perfil
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              navigate("/settings")
            }}
            className="cursor-pointer"
          >
            Configuración
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              handleLogout()
            }}
            className="cursor-pointer text-red-600 focus:text-red-700"
          >
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
