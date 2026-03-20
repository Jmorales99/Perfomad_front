import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PlatformSummary } from "@/infrastructure/api/platformRepository"

interface PlatformCardProps {
  platform: PlatformSummary
}

const platformLabels: Record<string, string> = {
  meta: "Meta (Facebook/Instagram)",
  google_ads: "Google Ads",
  linkedin: "LinkedIn Ads",
}


const platformColors: Record<string, string> = {
  meta: "bg-blue-500",
  google_ads: "bg-red-500",
  linkedin: "bg-blue-600",
}

export function PlatformCard({ platform }: PlatformCardProps) {
  const navigate = useNavigate()

  const handleViewDetails = () => {
    const platformPath = platform.platform === "google_ads" ? "google-ads" : platform.platform
    navigate(`/platforms/${platformPath}`)
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={platform.is_connected ? handleViewDetails : undefined}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${platformColors[platform.platform]}`} />
            <span className="text-xs font-semibold">{platformLabels[platform.platform] || platform.platform}</span>
          </div>
          <Badge variant={platform.is_connected ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
            {platform.is_connected ? "Conectado" : "No conectado"}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-[10px] text-gray-500">Campañas</p>
            <p className="text-base font-bold">{platform.total_campaigns}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Activas</p>
            <p className="text-base font-bold text-green-600">{platform.active_campaigns}</p>
          </div>
          {platform.total_campaigns > 0 && platform.metrics.impressions > 0 ? (
            <>
              <div>
                <p className="text-[10px] text-gray-500">CTR</p>
                <p className="text-sm font-semibold">{platform.metrics.ctr.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">ROA</p>
                <p className="text-sm font-semibold">
                  {platform.metrics.roa && platform.metrics.roa > 0 ? `${platform.metrics.roa.toFixed(2)}x` : "-"}
                </p>
              </div>
            </>
          ) : (
            <div className="col-span-2">
              <p className="text-[10px] text-gray-400 text-center mt-0.5">
                {platform.is_connected ? "Sin campañas activas" : "Conecta tu cuenta para comenzar"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

