import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useCallback, useMemo } from "react"
import { getCampaignInsights, getCampaignOverview, getCampaigns, getCampaignById, syncCampaignMetrics, getCampaignSalesHistory, type CampaignDTO, type SalesHistoryResponse } from "@/infrastructure/api/campaignsRepository"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Rocket, TrendingUp, AlertCircle, CheckCircle, Info, RefreshCw, DollarSign } from "lucide-react"
import { useAuth } from "@/app/providers/AuthProvider"
import { SalesChart } from "@/components/SalesChart"

interface CampaignInsights {
  campaign_id: string
  campaign_name: string
  insights: any
  recommendations: Array<{
    type: string
    priority: "high" | "medium" | "low"
    title: string
    description: string
    action: string
  }>
}

export default function CampaignDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasSubscription } = useAuth()
  const [campaign, setCampaign] = useState<CampaignDTO | null>(null)
  const [insights, setInsights] = useState<CampaignInsights | null>(null)
  const [overview, setOverview] = useState<any>(null)
  const [salesHistory, setSalesHistory] = useState<SalesHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // Memoize fetchData function
  const fetchData = useCallback(async () => {
    if (!id) return

    try {
      // Try to get campaign directly by ID first, then fallback to list
      let foundCampaign: CampaignDTO | null = null
      try {
        foundCampaign = await getCampaignById(id)
      } catch (directError) {
        // Fallback to list and find
        console.warn("Direct campaign fetch failed, trying list:", directError)
        const campaignsData = await getCampaigns()
        foundCampaign = campaignsData.find((c) => c.id === id) || null
      }

      // Fetch insights, overview, and sales history in parallel
      const [insightsData, overviewData, salesHistoryData] = await Promise.all([
        getCampaignInsights(id).catch((err) => {
          console.error("Error fetching insights:", err)
          return null
        }),
        getCampaignOverview(id).catch((err) => {
          console.error("Error fetching overview:", err)
          return null
        }),
        getCampaignSalesHistory(id, 30).catch((err) => {
          console.error("Error fetching sales history:", err)
          return null
        }),
      ])

      setCampaign(foundCampaign)
      setInsights(insightsData)
      setOverview(overviewData)
      setSalesHistory(salesHistoryData)
    } catch (err) {
      console.error("Error al obtener datos:", err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSyncMetrics = useCallback(async () => {
    if (!id) return
    setSyncing(true)
    try {
      await syncCampaignMetrics(id)
      // Refresh data after sync
      const [insightsData, overviewData, salesHistoryData] = await Promise.all([
        getCampaignInsights(id).catch(() => null),
        getCampaignOverview(id).catch(() => null),
        getCampaignSalesHistory(id, 30).catch(() => null),
      ])
      setInsights(insightsData)
      setOverview(overviewData)
      setSalesHistory(salesHistoryData)
    } catch (err) {
      console.error("Error sincronizando métricas:", err)
    } finally {
      setSyncing(false)
    }
  }, [id])

  const priorityColors = useMemo(() => ({
    high: "bg-red-100 text-red-700 border-red-300",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
    low: "bg-blue-100 text-blue-700 border-blue-300",
  }), [])

  const priorityIcons = useMemo(() => ({
    high: AlertCircle,
    medium: Info,
    low: CheckCircle,
  }), [])

  const platformLabels: Record<string, string> = useMemo(() => ({
    meta: "Meta",
    google_ads: "Google Ads",
    linkedin: "LinkedIn",
  }), [])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">Cargando datos de la campaña...</div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Button variant="outline" onClick={() => navigate("/campaigns")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Campaña no encontrada</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/campaigns")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              {campaign.platforms.map((platform) => (
                <Badge key={platform} variant="outline">
                  {platformLabels[platform] || platform}
                </Badge>
              ))}
              <Badge
                className={
                  campaign.status === "active"
                    ? "bg-green-100 text-green-700"
                    : campaign.status === "paused"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
                }
              >
                {campaign.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {hasSubscription && (
            <Button
              variant="outline"
              onClick={handleSyncMetrics}
              disabled={syncing}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sincronizar Métricas
            </Button>
          )}
        </div>
      </div>

      {/* Campaign Overview Metrics */}
      {overview && overview.metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Gasto</p>
              <p className="text-2xl font-bold text-green-600">
                ${typeof overview.metrics === "object" && !Array.isArray(overview.metrics)
                  ? overview.metrics.spend?.toFixed(2) || campaign.spend_usd.toFixed(2)
                  : campaign.spend_usd.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Impresiones</p>
              <p className="text-2xl font-bold text-blue-600">
                {typeof overview.metrics === "object" && !Array.isArray(overview.metrics)
                  ? overview.metrics.impressions?.toLocaleString() || "0"
                  : "0"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Clics</p>
              <p className="text-2xl font-bold text-purple-600">
                {typeof overview.metrics === "object" && !Array.isArray(overview.metrics)
                  ? overview.metrics.clicks?.toLocaleString() || "0"
                  : "0"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">CTR</p>
              <p className="text-2xl font-bold text-orange-600">
                {typeof overview.metrics === "object" && !Array.isArray(overview.metrics)
                  ? ((overview.metrics.ctr || 0) * 100).toFixed(2) + "%"
                  : "0%"}
              </p>
            </CardContent>
          </Card>
          {typeof overview.metrics === "object" && !Array.isArray(overview.metrics) && overview.metrics.cpa !== undefined && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-gray-600">CPA</p>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  ${overview.metrics.cpa.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Cost Per Acquisition</p>
              </CardContent>
            </Card>
          )}
          {typeof overview.metrics === "object" && !Array.isArray(overview.metrics) && overview.metrics.roa !== undefined && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-gray-600">ROA</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {overview.metrics.roa.toFixed(2)}x
                </p>
                <p className="text-xs text-gray-500">Return on Ad Spend</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Campaign Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Campaña</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Presupuesto</p>
              <p className="text-lg font-semibold">${campaign.budget_usd.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gasto Actual</p>
              <p className="text-lg font-semibold">${campaign.spend_usd.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha de Inicio</p>
              <p className="text-lg font-semibold">
                {new Date(campaign.start_date).toLocaleDateString()}
              </p>
            </div>
            {campaign.end_date && (
              <div>
                <p className="text-sm text-gray-600">Fecha de Fin</p>
                <p className="text-lg font-semibold">
                  {new Date(campaign.end_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {campaign.description && (
              <div>
                <p className="text-sm text-gray-600">Descripción</p>
                <p className="text-base">{campaign.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Utilización de Presupuesto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso</span>
                <span className="font-semibold">
                  {campaign.budget_usd > 0
                    ? ((campaign.spend_usd / campaign.budget_usd) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all"
                  style={{
                    width: `${
                      campaign.budget_usd > 0
                        ? Math.min((campaign.spend_usd / campaign.budget_usd) * 100, 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="text-xs text-gray-500">
                ${campaign.spend_usd.toFixed(2)} de ${campaign.budget_usd.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales History Chart */}
      {salesHistory && salesHistory.data && salesHistory.data.length > 0 && (
        <SalesChart
          data={salesHistory.data}
          improvement={salesHistory.improvement}
          periodDays={salesHistory.period_days}
          title={`Historial de Ventas - ${campaign.name}`}
        />
      )}

      {/* Optimization Insights and Recommendations */}
      {insights && insights.recommendations && insights.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-blue-600" />
              Recomendaciones de Optimización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.recommendations.map((rec: any, index) => {
                const Icon = priorityIcons[rec.priority]
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${priorityColors[rec.priority]}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-base">{rec.title}</h4>
                          <Badge
                            variant="outline"
                            className={
                              rec.priority === "high"
                                ? "border-red-300 text-red-700"
                                : rec.priority === "medium"
                                ? "border-yellow-300 text-yellow-700"
                                : "border-blue-300 text-blue-700"
                            }
                          >
                            {rec.priority === "high"
                              ? "Alta"
                              : rec.priority === "medium"
                              ? "Media"
                              : "Baja"}
                          </Badge>
                        </div>
                        <p className="text-sm mb-3 text-gray-700">{rec.description}</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-600">Acción:</span>
                            <span className="text-xs text-gray-700">{rec.action}</span>
                          </div>
                          {rec.impact && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-600">Impacto:</span>
                              <span className="text-xs text-gray-700">{rec.impact}</span>
                            </div>
                          )}
                          {rec.estimatedImprovement && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-600">Mejora estimada:</span>
                              <span className="text-xs text-blue-600 font-medium">{rec.estimatedImprovement}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Data */}
      {insights && insights.insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Insights Detallados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(insights.insights, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {!insights?.recommendations || insights.recommendations.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <Info className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No hay recomendaciones disponibles en este momento.</p>
            <p className="text-sm mt-2 mb-4">
              {hasSubscription
                ? "Sincroniza las métricas de la campaña para obtener insights."
                : "Activa tu suscripción para obtener recomendaciones de optimización."}
            </p>
            {hasSubscription && campaign && (
              <Button
                onClick={async () => {
                  if (!campaign?.id || syncing) return
                  setSyncing(true)
                  try {
                    await syncCampaignMetrics(campaign.id)
                    // Refresh insights after sync
                    const newInsights = await getCampaignInsights(campaign.id)
                    setInsights(newInsights)
                    // Also refresh overview
                    const newOverview = await getCampaignOverview(campaign.id).catch(() => null)
                    setOverview(newOverview)
                    // Refresh campaign data
                    const updatedCampaign = await getCampaignById(campaign.id)
                    setCampaign(updatedCampaign)
                  } catch (error) {
                    console.error("Error syncing metrics:", error)
                    alert("Error al sincronizar métricas. Intenta de nuevo.")
                  } finally {
                    setSyncing(false)
                  }
                }}
                disabled={syncing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Sincronizando..." : "🔄 Sincronizar métricas"}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

