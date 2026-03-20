import { useNavigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import clsx from "clsx"

import { useAuth } from "@/app/providers/AuthProvider"
import { useClient } from "@/app/providers/ClientProvider"
import { getProfile } from "@/infrastructure/api/profileRepository"

// Icons
import { 
  Home, 
  Megaphone, 
  Facebook, 
  Link2, 
  Linkedin, 
  Music, 
  Image as ImageIcon, 
  Settings,
  LogOut,
  User,
  ChevronDown,
  Building2,
} from "lucide-react"

// shadcn/ui
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  isActive?: (pathname: string) => boolean
}

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const { clients, selectedClient, setSelectedClientId } = useClient()

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

  const isActive = (path: string) => location.pathname === path
  const isPlatformActive = (platform: string) => location.pathname.startsWith(`/platforms/${platform}`)

  const mainNavItems: NavItem[] = [
    {
      label: "Inicio",
      path: "/home",
      icon: <Home className="w-5 h-5" />,
      isActive: (pathname) => pathname === "/home"
    },
    {
      label: "Campañas",
      path: "/campaigns",
      icon: <Megaphone className="w-5 h-5" />,
      isActive: (pathname) => pathname === "/campaigns" || pathname.startsWith("/campaigns/") || pathname.startsWith("/optimize/")
    },
    {
      label: "Marcas",
      path: "/brands",
      icon: <Building2 className="w-5 h-5" />,
      isActive: (pathname) => pathname === "/brands"
    },
  ]

  const platformNavItems: NavItem[] = [
    {
      label: "Meta",
      path: "/platforms/meta",
      icon: <Facebook className="w-5 h-5" />,
      isActive: (pathname) => pathname === "/platforms/meta" || isPlatformActive("meta")
    },
    {
      label: "Google Ads",
      path: "/platforms/google-ads",
      icon: <Link2 className="w-5 h-5" />,
      isActive: (pathname) => pathname === "/platforms/google-ads" || isPlatformActive("google-ads")
    },
    {
      label: "LinkedIn",
      path: "/platforms/linkedin",
      icon: <Linkedin className="w-5 h-5" />,
      isActive: (pathname) => pathname === "/platforms/linkedin" || isPlatformActive("linkedin")
    },
    {
      label: "TikTok",
      path: "/platforms/tiktok",
      icon: <Music className="w-5 h-5" />,
      isActive: (pathname) => pathname === "/platforms/tiktok" || isPlatformActive("tiktok")
    },
  ]

  const otherNavItems: NavItem[] = [
    {
      label: "Imágenes",
      path: "/images",
      icon: <ImageIcon className="w-5 h-5" />,
      isActive: (pathname) => pathname === "/images"
    },
    {
      label: "Configuración",
      path: "/settings",
      icon: <Settings className="w-5 h-5" />,
      isActive: (pathname) => pathname === "/settings"
    },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      {/* Logo + Brand Switcher */}
      <div className="border-b border-gray-200">
        {/* Logo row */}
        <div
          className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-gray-50 transition"
          onClick={() => navigate("/home")}
        >
          <img src="/logo.svg" alt="Perfomad" className="w-8 h-8" />
          <h1 className="text-xl font-bold text-blue-700 tracking-tight">
            Perfomad
          </h1>
        </div>

        {/* Marca activa — workspace switcher */}
        <div className="px-3 pb-3">
          {clients.length === 0 ? (
            <button
              onClick={() => navigate("/brands")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 border border-dashed border-gray-300 hover:bg-gray-50 transition"
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="truncate">Sin marca</span>
            </button>
          ) : clients.length === 1 ? (
            <button
              onClick={() => navigate("/brands")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition"
            >
              <Building2 className="w-4 h-4 shrink-0 text-blue-500" />
              <span className="truncate flex-1 text-left">{selectedClient?.name ?? clients[0].name}</span>
            </button>
          ) : (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 transition">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate">{selectedClient?.name ?? "Seleccionar..."}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
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
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Main Navigation */}
        <div className="space-y-1 mb-6">
          {mainNavItems.map((item) => {
            const active = item.isActive ? item.isActive(location.pathname) : isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Platforms Section */}
        <div className="mb-6">
          <div className="px-3 mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Plataformas
            </h3>
          </div>
          <div className="space-y-1">
            {platformNavItems.map((item) => {
              const active = item.isActive ? item.isActive(location.pathname) : isActive(item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={clsx(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Other Navigation */}
        <div className="space-y-1">
          {otherNavItems.map((item) => {
            const active = item.isActive ? item.isActive(location.pathname) : isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* User Menu */}
      <div className="border-t border-gray-200 p-4">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="truncate">{name || "Usuario"}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            side="right"
            sideOffset={8}
            className="w-56 rounded-xl border border-gray-200 bg-white shadow-xl"
          >
            <DropdownMenuLabel className="text-gray-500">
              Cuenta
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                navigate("/settings?tab=profile")
              }}
              className="cursor-pointer"
            >
              <User className="w-4 h-4 mr-2" />
              Perfil
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                navigate("/settings")
              }}
              className="cursor-pointer"
            >
              <Settings className="w-4 h-4 mr-2" />
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
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}

