import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PlatformSummary } from "@/infrastructure/api/platformRepository"
import type { ConsolidatedPlatform } from "@/infrastructure/api/dashboardRepository"
import { MetricTooltip } from "@/interface/components/MetricTooltip"

interface PlatformCardProps {
  platform: PlatformSummary
  /** Real consolidated metrics from the dashboard snapshot (optional). */
  consolidatedData?: ConsolidatedPlatform
}

const platformLabels: Record<string, string> = {
  meta: "Meta (Facebook/Instagram)",
  google_ads: "Google Ads",
  linkedin: "LinkedIn Ads",
  tiktok: "TikTok Ads",
}

const platformColors: Record<string, string> = {
  meta: "bg-blue-500",
  google_ads: "bg-red-500",
  linkedin: "bg-blue-700",
  tiktok: "bg-black",
}

export function PlatformCard({ platform, consolidatedData }: PlatformCardProps) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    const platformPath = platform.platform === "google_ads" ? "google-ads" : platform.platform
    navigate(`/platforms/${platformPath}`)
  }

  // Prefer consolidated live data counts when available
  const campaignCount = consolidatedData
    ? consolidatedData.campaigns.length
    : platform.total_campaigns
  const activeCampaignCount = consolidatedData
    ? consolidatedData.campaigns.filter((c) => c.status === "active").length
    : platform.active_campaigns

  const hasConsolidatedMetrics = !!consolidatedData && consolidatedData.spend > 0

  return (
    <Card
      className={`transition-all duration-200 ${platform.is_connected ? "cursor-pointer hover:shadow-sm" : "opacity-80"}`}
      onClick={() => setExpanded((prev) => !prev)}
    >
      <CardContent className="p-3">
        {/* ── Collapsed header (always visible) ── */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${platformColors[platform.platform] ?? "bg-gray-400"}`} />
            <span className="text-xs font-semibold text-gray-800 truncate leading-tight">
              {platformLabels[platform.platform] ?? platform.platform}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant={platform.is_connected ? "default" : "secondary"}
              className="text-[10px] px-1.5 py-0 h-4"
            >
              {platform.is_connected ? "Conectado" : "No conectado"}
            </Badge>
            {expanded
              ? <ChevronUp className="w-3 h-3 text-gray-400" />
              : <ChevronDown className="w-3 h-3 text-gray-400" />}
          </div>
        </div>

        {/* ── Compact stats (always visible) ── */}
        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className="text-gray-400">
            <span className="font-bold text-gray-700">{campaignCount}</span> campañas
          </span>
          <span className="text-gray-400">
            <span className="font-bold text-green-600">{activeCampaignCount}</span> activas
          </span>
        </div>

        {/* ── Expanded details ── */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            {hasConsolidatedMetrics ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <div>
                  <p className="text-[10px] text-gray-400 leading-none mb-0.5">
                    <MetricTooltip metric="ctr">CTR</MetricTooltip>
                  </p>
                  <p className="font-semibold text-gray-700">
                    {consolidatedData!.ctr.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 leading-none mb-0.5">
                    <MetricTooltip metric="roa">ROA</MetricTooltip>
                  </p>
                  <p className="font-semibold text-gray-700">
                    {consolidatedData!.roa && consolidatedData!.roa > 0
                      ? `${consolidatedData!.roa.toFixed(2)}x`
                      : "—"}
                  </p>
                </div>
                <div className="col-span-2 mt-0.5">
                  <p className="text-[10px] text-gray-400 leading-none mb-0.5">
                    <MetricTooltip metric="spend">Gasto</MetricTooltip>
                  </p>
                  <p className="font-semibold text-green-600">
                    ${consolidatedData!.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            ) : platform.is_connected ? (
              <p className="text-[10px] text-gray-400 text-center">
                Sincroniza para ver métricas
              </p>
            ) : (
              <p className="text-[10px] text-gray-400 text-center">
                Conecta tu cuenta para comenzar
              </p>
            )}

            {platform.is_connected && (
              <button
                onClick={handleViewDetails}
                className="w-full text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline mt-1 text-center"
              >
                Ver detalle →
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
