import { usePlatformMetrics, usePlatformInsights } from "@/interface/hooks/usePlatforms"
import type { PlatformInsightListItem } from "@/infrastructure/api/platformRepository"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, TrendingUp, Eye, MousePointerClick } from "lucide-react"

export default function TikTokPage() {
  // Note: TikTok platform is "tiktok" but API might use different format
  // This will need to be adjusted when TikTok integration is implemented
  const { data: metrics, loading: metricsLoading, error: metricsError } = usePlatformMetrics("google_ads" as any) // Placeholder
  const { data: insights, loading: insightsLoading } = usePlatformInsights("google_ads" as any) // Placeholder

  if (metricsLoading || insightsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">Cargando datos de TikTok...</div>
        </div>
      </div>
    )
  }

  if (metricsError || !metrics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                TikTok aún no está disponible
              </h3>
              <p className="text-gray-600">
                La integración con TikTok está en desarrollo. Próximamente podrás conectar tu cuenta y gestionar tus campañas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">TikTok Ads</h1>
          <p className="text-gray-600">
            Gestiona tus campañas y métricas de TikTok desde un solo lugar
          </p>
        </div>

        {metrics.is_connected === true ? (
          <div className="space-y-6">
            {/* Connection Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Estado de Conexión</CardTitle>
                  <Badge variant="default">Conectado</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Cuenta:{" "}
                  <span className="font-semibold">{metrics.account_name ?? "—"}</span>
                </p>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">Impresiones</p>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {metrics.metrics.impressions.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">Clics</p>
                    <MousePointerClick className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {metrics.metrics.clicks.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">CTR</p>
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {metrics.metrics.ctr.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Insights */}
            {insights?.insights && insights.insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Insights y Recomendaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.insights.map((insight: PlatformInsightListItem, index: number) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border border-gray-200 bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-semibold text-sm">{insight.message}</p>
                          <Badge
                            variant={
                              insight.severity === "high"
                                ? "destructive"
                                : insight.severity === "medium"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {insight.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{insight.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Conecta tu cuenta de TikTok
              </h3>
              <p className="text-gray-600 mb-4">
                Conecta tu cuenta de TikTok Ads para comenzar a gestionar tus campañas.
              </p>
              <button
                onClick={() => window.location.href = "/settings?tab=integrations"}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Ir a Configuración
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

