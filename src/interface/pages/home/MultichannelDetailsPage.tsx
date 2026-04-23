import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState, useCallback } from "react"
import { ArrowLeft, Sparkles, DollarSign, Eye, MousePointerClick, TrendingUp, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getMultichannelCampaign,
  getMultichannelMetrics,
  updateMultichannelStatus,
  updateMultichannelPlatformStatus,
  type MultichannelCampaign,
  type MultichannelMetrics,
} from "@/infrastructure/api/multichannelCampaignsRepository"
import type { Platform } from "@/infrastructure/api/campaignsRepository"
import { ApiError } from "@/infrastructure/api/errors"

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta",
  google_ads: "Google Ads",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-700",
  draft: "bg-blue-100 text-blue-700",
  publishing: "bg-blue-100 text-blue-700",
  partial_failed: "bg-orange-100 text-orange-700",
  archived: "bg-gray-100 text-gray-700",
}

const STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  paused: "Pausada",
  completed: "Completada",
  draft: "Borrador",
  publishing: "Publicando",
  partial_failed: "Error parcial",
  archived: "Archivada",
}

export default function MultichannelDetailsPage() {
  const { multichannelId } = useParams<{ multichannelId: string }>()
  const navigate = useNavigate()

  const [campaign, setCampaign] = useState<MultichannelCampaign | null>(null)
  const [metrics, setMetrics] = useState<MultichannelMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!multichannelId) return
    setLoading(true)
    setError(null)
    try {
      const [campaignData, metricsData] = await Promise.all([
        getMultichannelCampaign(multichannelId),
        getMultichannelMetrics(multichannelId).catch(() => null),
      ])
      setCampaign(campaignData)
      setMetrics(metricsData)
    } catch (e) {
      setError(e instanceof ApiError ? e.serverMessage ?? e.message : "Error al cargar la campaña.")
    } finally {
      setLoading(false)
    }
  }, [multichannelId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleStatusAction = async (action: "pause" | "resume" | "archive") => {
    if (!multichannelId) return
    setActionLoading(action)
    try {
      const updated = await updateMultichannelStatus(multichannelId, action)
      setCampaign(updated)
    } catch (e) {
      setError(e instanceof ApiError ? e.serverMessage ?? e.message : "Error al actualizar estado.")
    } finally {
      setActionLoading(null)
    }
  }

  const handlePlatformAction = async (platform: Platform, action: "pause" | "resume") => {
    if (!multichannelId) return
    setActionLoading(`${platform}_${action}`)
    try {
      const updated = await updateMultichannelPlatformStatus(multichannelId, platform, action)
      setCampaign(updated)
    } catch (e) {
      setError(e instanceof ApiError ? e.serverMessage ?? e.message : "Error al actualizar plataforma.")
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/campaigns")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Mis Campañas
        </Button>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-gray-600">{error || "Campaña no encontrada."}</p>
            <Button className="mt-4" onClick={fetchData}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const consolidated = metrics?.consolidated
  const canPause = campaign.status === "active"
  const canResume = campaign.status === "paused"

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/campaigns")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Mis Campañas
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className="bg-purple-100 text-purple-700">Multicanal</Badge>
              <Badge className={STATUS_COLORS[campaign.status] || "bg-gray-100 text-gray-700"}>
                {STATUS_LABELS[campaign.status] || campaign.status}
              </Badge>
              {campaign.platforms.map((p) => (
                <Badge key={p} variant="outline" className="text-xs">
                  {PLATFORM_LABELS[p] ?? p}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canPause && (
            <Button
              variant="outline"
              onClick={() => handleStatusAction("pause")}
              disabled={actionLoading !== null}
            >
              {actionLoading === "pause" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pausar"}
            </Button>
          )}
          {canResume && (
            <Button
              variant="outline"
              onClick={() => handleStatusAction("resume")}
              disabled={actionLoading !== null}
            >
              {actionLoading === "resume" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reanudar"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Budget + Consolidated Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Presupuesto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total</span>
              <span className="font-semibold">
                {campaign.total_budget_usd ? `$${campaign.total_budget_usd.toLocaleString()} ${campaign.currency}` : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Plataformas</span>
              <span className="font-semibold">{campaign.platforms.length}</span>
            </div>
            {campaign.start_date && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Inicio</span>
                <span className="font-semibold">{new Date(campaign.start_date).toLocaleDateString()}</span>
              </div>
            )}
            {campaign.end_date && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fin</span>
                <span className="font-semibold">{new Date(campaign.end_date).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {consolidated ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Métricas Consolidadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Gasto</p>
                    <p className="font-semibold">${consolidated.spend.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Impresiones</p>
                    <p className="font-semibold">{consolidated.impressions.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Clics / CTR</p>
                    <p className="font-semibold">{consolidated.clicks.toLocaleString()} / {(consolidated.ctr * 100).toFixed(2)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-500">ROAS</p>
                    <p className="font-semibold">{consolidated.roas.toFixed(2)}x</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-400 text-sm">
              Métricas no disponibles aún.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Per-platform breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rendimiento por Plataforma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaign.platforms.map((platform) => {
            const pm = metrics?.by_platform?.[platform as Platform]
            const isActive = campaign.status === "active"
            const isPaused = campaign.status === "paused"
            const loadingKey = `${platform}_pause`
            const loadingResumeKey = `${platform}_resume`

            return (
              <div key={platform} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{PLATFORM_LABELS[platform] ?? platform}</h3>
                  <div className="flex gap-2">
                    {isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePlatformAction(platform as Platform, "pause")}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === loadingKey ? <Loader2 className="w-3 h-3 animate-spin" /> : "Pausar"}
                      </Button>
                    )}
                    {isPaused && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePlatformAction(platform as Platform, "resume")}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === loadingResumeKey ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reanudar"}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/platforms/${platform}`)}
                    >
                      Ver en plataforma →
                    </Button>
                  </div>
                </div>
                {pm ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Gasto</p>
                      <p className="font-semibold">${pm.spend.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">CTR</p>
                      <p className="font-semibold">{(pm.ctr * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Conversiones</p>
                      <p className="font-semibold">{pm.conversions}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">ROAS</p>
                      <p className="font-semibold">{pm.roas.toFixed(2)}x</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Sin métricas disponibles para esta plataforma.</p>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Optimize link */}
      {campaign.campaign?.id && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800 font-medium">Optimiza esta campaña con IA</p>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate(`/optimize/${campaign.campaign!.id}`)}
            >
              Optimizar con IA →
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
