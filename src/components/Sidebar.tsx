import { useNavigate, useLocation } from "react-router-dom"
import clsx from "clsx"

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
  Building2,
  Sparkles,
} from "lucide-react"

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  isActive?: (pathname: string) => boolean
}

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

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
      label: "Mis Campañas",
      path: "/campaigns",
      icon: <Megaphone className="w-5 h-5" />,
      isActive: (pathname) => pathname === "/campaigns" || pathname.startsWith("/campaigns/")
    },
    {
      label: "Optimización",
      path: "/optimize",
      icon: <Sparkles className="w-5 h-5" />,
      isActive: (pathname) => pathname === "/optimize" || pathname.startsWith("/optimize/")
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
    <aside className="fixed left-0 top-0 h-screen w-52 bg-white border-r border-gray-200 flex flex-col z-50">
      {/* Logo */}
      <div
        className="h-14 flex items-center gap-2 px-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => navigate("/home")}
      >
        <img src="/logo.svg" alt="Performad" className="w-8 h-8" />
        <h1 className="text-xl font-bold text-blue-700 tracking-tight">Performad</h1>
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

    </aside>
  )
}

