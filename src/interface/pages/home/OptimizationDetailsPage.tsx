import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState, useCallback } from "react"
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCampaignById, type CampaignDTO } from "@/infrastructure/api/campaignsRepository"
import OptimizePanel from "@/interface/components/optimization/OptimizePanel"

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta",
  google_ads: "Google Ads",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
}

export default function OptimizationDetailsPage() {
  const { internalCampaignId } = useParams<{ internalCampaignId: string }>()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<CampaignDTO | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCampaign = useCallback(async () => {
    if (!internalCampaignId) return
    setLoading(true)
    try {
      const data = await getCampaignById(internalCampaignId)
      setCampaign(data)
    } catch {
      setCampaign(null)
    } finally {
      setLoading(false)
    }
  }, [internalCampaignId])

  useEffect(() => {
    fetchCampaign()
  }, [fetchCampaign])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  const campaignName = campaign?.name ?? internalCampaignId ?? "Campaña"
  const platforms: string[] = campaign
    ? Array.isArray(campaign.platforms)
      ? campaign.platforms
      : [campaign.platforms ?? "meta"]
    : []

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/optimize")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Optimización
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">{campaignName}</h1>
          {platforms.map((p) => (
            <Badge key={p} variant="outline" className="text-xs">
              {PLATFORM_LABELS[p] ?? p}
            </Badge>
          ))}
          {campaign && (
            <Badge
              className={
                campaign.status === "active"
                  ? "bg-green-100 text-green-700"
                  : campaign.status === "paused"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
              }
            >
              {campaign.status === "active" ? "Activa" : campaign.status === "paused" ? "Pausada" : campaign.status}
            </Badge>
          )}
        </div>
      </div>

      {internalCampaignId && (
        <OptimizePanel campaignId={internalCampaignId} campaignName={campaignName} />
      )}
    </div>
  )
}
