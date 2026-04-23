import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import clsx from "clsx"
import { useAuth } from "@/app/providers/AuthProvider"
import { useClient } from "@/app/providers/ClientProvider"
import { getProfile } from "@/infrastructure/api/profileRepository"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Building2,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from "lucide-react"

export function TopHeader() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { clients, selectedClient, setSelectedClientId } = useClient()
  const [name, setName] = useState<string>("")

  useEffect(() => {
    getProfile()
      .then((p) => setName(p.name))
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
    setTimeout(() => navigate("/"), 0)
  }

  return (
    <header className="h-14 bg-white/95 backdrop-blur border-b border-gray-200 flex items-center justify-end px-6 gap-3 flex-shrink-0 sticky top-0 z-40">
      {/* Brand / Client selector */}
      {clients.length === 0 ? (
        <button
          onClick={() => navigate("/brands")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500 border border-dashed border-gray-300 hover:bg-gray-50 transition"
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>Sin marca</span>
        </button>
      ) : clients.length === 1 ? (
        <button
          onClick={() => navigate("/brands")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition"
        >
          <Building2 className="w-4 h-4 shrink-0 text-blue-500" />
          <span className="max-w-[160px] truncate">{selectedClient?.name ?? clients[0].name}</span>
        </button>
      ) : (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 transition">
              <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="max-w-[160px] truncate">{selectedClient?.name ?? "Seleccionar..."}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Cambiar marca</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {clients.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onSelect={() => setSelectedClientId(c.id)}
                className={clsx(
                  "cursor-pointer",
                  c.id === selectedClient?.id && "font-semibold text-blue-700"
                )}
              >
                {c.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => navigate("/brands")}
              className="cursor-pointer text-blue-600"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Gestionar marcas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Divider */}
      <div className="h-6 w-px bg-gray-200" />

      {/* User profile dropdown */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <span className="max-w-[140px] truncate hidden sm:block">{name || "Usuario"}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl border border-gray-200 bg-white shadow-xl">
          <DropdownMenuLabel className="text-gray-500">Cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => navigate("/settings?tab=profile")}
            className="cursor-pointer"
          >
            <User className="w-4 h-4 mr-2" />
            Perfil
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => navigate("/settings")}
            className="cursor-pointer"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleLogout}
            className="cursor-pointer text-red-600 focus:text-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
