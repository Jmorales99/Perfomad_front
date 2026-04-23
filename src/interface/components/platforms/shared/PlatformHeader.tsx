import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { ReactNode } from "react"

interface PlatformHeaderProps {
  title: string
  brandName?: string | null
  backTo?: string
  actions?: ReactNode
}

export default function PlatformHeader({
  title,
  brandName,
  backTo = "/home",
  actions,
}: PlatformHeaderProps) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(backTo)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {brandName && (
            <p className="text-sm text-gray-500">
              Marca: <span className="font-medium text-gray-700">{brandName}</span>
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
