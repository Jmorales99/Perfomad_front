import { usePlatformMetrics, usePlatformInsights } from "@/interface/hooks/usePlatforms"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, TrendingUp, Eye, MousePointerClick, DollarSign } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

export default function GoogleAdsPage() {
  const navigate = useNavigate()
  const { data: metrics, loading: metricsLoading, refetch: refetchMetrics } = usePlatformMetrics("google_ads")
  const { data: insights, loading: insightsLoading, refetch: refetchInsights } = usePlatformInsights("google_ads")
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchMetrics(), refetchInsights()])
    setRefreshing(false)
  }

  if (metricsLoading || insightsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/home")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
        <div className="text-center py-12">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/home")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Google Ads</h1>
            <p className="text-gray-600">Métricas y insights de Google Ads</p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {metrics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Campañas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.summary.total_campaigns}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.summary.active_campaigns} activas
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Impresiones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.metrics.impressions.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4" />
                  Clics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.metrics.clicks.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">CTR: {metrics.metrics.ctr.toFixed(2)}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  ROA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.metrics.roa ? `${metrics.metrics.roa.toFixed(2)}x` : "N/A"}
                </div>
                <div className="text-xs text-gray-500 mt-1">Revenue: ${metrics.metrics.revenue.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas Detalladas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Conversiones</p>
                  <p className="text-xl font-semibold">{metrics.metrics.conversions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CPC</p>
                  <p className="text-xl font-semibold">${metrics.metrics.cpc.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CPM</p>
                  <p className="text-xl font-semibold">${metrics.metrics.cpm.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CPA</p>
                  <p className="text-xl font-semibold">
                    {metrics.metrics.cpa ? `$${metrics.metrics.cpa.toFixed(2)}` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gasto Total</p>
                  <p className="text-xl font-semibold">${metrics.summary.total_spend.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Presupuesto</p>
                  <p className="text-xl font-semibold">${metrics.summary.total_budget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ventas</p>
                  <p className="text-xl font-semibold">${metrics.metrics.sales.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cuentas Conectadas</p>
                  <p className="text-xl font-semibold">{metrics.summary.connected_accounts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns List */}
          {metrics.campaigns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Campañas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      <div>
                        <p className="font-semibold">{campaign.name}</p>
                        <p className="text-sm text-gray-500">
                          ${campaign.spend_usd.toLocaleString()} / ${campaign.budget_usd.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                        {campaign.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          {insights && insights.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recomendaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.recommendations.slice(0, 5).map((rec, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{rec.title}</h4>
                            <Badge
                              variant={
                                rec.priority === "high"
                                  ? "destructive"
                                  : rec.priority === "medium"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{rec.description}</p>
                          {rec.action && (
                            <p className="text-sm text-blue-600 mt-1">Acción: {rec.action}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

