import { useEffect, useMemo, useState, useCallback } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  History,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from "lucide-react"
import {
  analyzeCampaign,
  applyRecommendation,
  getLatestRecommendations,
  listOptimizationRuns,
  type AnalyzeResult,
  type ApplyResult,
  type LatestRecommendationsResult,
  type OptimizationRecommendation,
  type OptimizationRunSummary,
  type RecommendationWithDecision,
} from "@/infrastructure/api/optimizationRepository"
import { ApiError } from "@/infrastructure/api/errors"

interface OptimizePanelProps {
  campaignId: string
  campaignName: string
}

const PRIORITY_LABELS: Record<string, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
}

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-300",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  low: "bg-blue-100 text-blue-700 border-blue-300",
}

const ACTION_LABELS: Record<string, string> = {
  pause_campaign: "Pausar campaña",
  resume_campaign: "Reanudar campaña",
  adjust_budget: "Ajustar presupuesto",
  flag_for_review: "Marcar para revisión",
  informational: "Informativo",
}

const HEALTH_CONFIG: Record<string, { label: string; cls: string; bar: string; icon: typeof CheckCircle2 }> = {
  good: { label: "Saludable", cls: "bg-green-50 text-green-800 border-green-200", bar: "bg-green-500", icon: CheckCircle2 },
  warning: { label: "Atención", cls: "bg-yellow-50 text-yellow-800 border-yellow-200", bar: "bg-yellow-500", icon: AlertCircle },
  critical: { label: "Crítico", cls: "bg-red-50 text-red-800 border-red-200", bar: "bg-red-500", icon: XCircle },
}

const TREND_CONFIG = {
  improving: { label: "Mejorando", icon: TrendingUp, cls: "text-green-700" },
  stable: { label: "Estable", icon: Minus, cls: "text-gray-600" },
  declining: { label: "Bajando", icon: TrendingDown, cls: "text-red-600" },
}

const URGENCY_STYLE: Record<string, string> = {
  immediate: "bg-red-50 border border-red-300 text-red-800",
  today: "bg-orange-50 border border-orange-300 text-orange-800",
  this_week: "bg-yellow-50 border border-yellow-300 text-yellow-800",
}

const URGENCY_LABEL: Record<string, string> = {
  immediate: "Urgente",
  today: "Hoy",
  this_week: "Esta semana",
}

const CRITERIA_LABELS: Record<string, string> = {
  ctr_performance: "CTR",
  cpa_efficiency: "CPA",
  budget_utilization: "Presupuesto",
  creative_freshness: "Creativos",
}

export default function OptimizePanel({ campaignId, campaignName }: OptimizePanelProps) {
  const [latest, setLatest] = useState<LatestRecommendationsResult | null>(null)
  const [runs, setRuns] = useState<OptimizationRunSummary[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [insufficient, setInsufficient] = useState<AnalyzeResult["insufficient_data"] | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const loadLatest = useCallback(async () => {
    try {
      const data = await getLatestRecommendations(campaignId)
      setLatest(data)
    } catch (err: any) {
      console.error("Error loading latest recommendations:", err)
    }
  }, [campaignId])

  const loadRuns = useCallback(async () => {
    try {
      const data = await listOptimizationRuns(campaignId, 10)
      setRuns(data.runs)
    } catch (err: any) {
      console.error("Error loading optimization runs:", err)
    }
  }, [campaignId])

  useEffect(() => {
    loadLatest()
  }, [loadLatest])

  useEffect(() => {
    if (showHistory) loadRuns()
  }, [showHistory, loadRuns])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError(null)
    setInsufficient(null)
    try {
      const result = await analyzeCampaign(campaignId)
      if (result.status === "insufficient_data") {
        setInsufficient(result.insufficient_data ?? null)
      } else if (result.status === "failed") {
        setError(result.error_message || "El análisis falló. Intenta más tarde.")
      }
      await loadLatest()
      if (showHistory) await loadRuns()
    } catch (err: any) {
      const displayed =
        err instanceof ApiError
          ? err.serverMessage || err.message
          : err?.response?.data?.error ?? err?.message ?? "Error analizando con IA"
      setError(displayed)
      // Still refresh recommendations — a previous succeeded run may be available.
      await loadLatest().catch(() => {})
      if (showHistory) await loadRuns().catch(() => {})
    } finally {
      setAnalyzing(false)
    }
  }

  const handleApply = async (
    rec: OptimizationRecommendation | RecommendationWithDecision,
    decision: "accept" | "reject"
  ) => {
    setApplyingId(rec.id)
    setError(null)
    try {
      const result: ApplyResult = await applyRecommendation(campaignId, {
        recommendation_id: rec.id,
        decision,
      })
      if (result.status === "failed") {
        setError(result.message)
      }
      await loadLatest()
      if (showHistory) await loadRuns()
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Error aplicando recomendación")
    } finally {
      setApplyingId(null)
    }
  }

  const recommendations: RecommendationWithDecision[] = useMemo(
    () => latest?.recommendations ?? [],
    [latest]
  )

  const summary = latest?.summary
  const healthCfg = summary?.overall_health
    ? (HEALTH_CONFIG[summary.overall_health] ?? HEALTH_CONFIG.warning)
    : null
  const trendCfg = summary?.health_trend
    ? (TREND_CONFIG[summary.health_trend.direction] ?? TREND_CONFIG.stable)
    : null
  const alerts = summary?.alerts ?? []
  const nextStep = summary?.next_step

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Optimización con IA
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory((v) => !v)}
            >
              <History className="w-4 h-4 mr-1" />
              {showHistory ? "Ocultar" : "Ver"} historial
            </Button>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analizando…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Optimizar con IA
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {insufficient && (
          <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
            <p className="font-medium">Datos insuficientes para generar recomendaciones.</p>
            <p>
              La campaña lleva {insufficient.days_active} día(s) activa con un gasto de $
              {insufficient.spend.toFixed(2)}. Mínimos requeridos:{" "}
              {insufficient.min_days} día(s) y ${insufficient.min_spend.toFixed(2)}.
            </p>
          </div>
        )}

        {/* Health summary */}
        {summary && healthCfg && (
          <div className={`p-4 rounded-lg border ${healthCfg.cls}`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <healthCfg.icon className="w-5 h-5" />
                <Badge className={healthCfg.cls}>{healthCfg.label}</Badge>
                {trendCfg && (
                  <span className={`flex items-center gap-1 text-xs font-medium ${trendCfg.cls}`}>
                    <trendCfg.icon className="w-3.5 h-3.5" />
                    {trendCfg.label}
                  </span>
                )}
              </div>
              {typeof summary.health_score === "number" && (
                <span className="text-3xl font-bold">
                  {summary.health_score}
                  <span className="text-sm font-normal opacity-60">/100</span>
                </span>
              )}
            </div>

            <p className="text-sm mt-2">{summary.headline}</p>

            {summary.health_score_criteria && (
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                {(["ctr_performance", "cpa_efficiency", "budget_utilization", "creative_freshness"] as const).map((key) => {
                  const val = summary.health_score_criteria![key]
                  const pct = Math.round((val / 25) * 100)
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="opacity-80">{CRITERIA_LABELS[key]}</span>
                        <span className="font-medium">{val}/25</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-black/10">
                        <div
                          className={`h-1.5 rounded-full ${healthCfg.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`p-3 rounded-md text-sm flex items-start gap-2 ${URGENCY_STYLE[alert.urgency] ?? URGENCY_STYLE.this_week}`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold mr-1">
                    {URGENCY_LABEL[alert.urgency] ?? alert.urgency}:
                  </span>
                  {alert.message}
                </div>
              </div>
            ))}
          </div>
        )}

        {recommendations.length === 0 && !insufficient && (
          <p className="text-sm text-gray-600">
            No hay recomendaciones aún para <span className="font-medium">{campaignName}</span>.
            Pulsa <span className="font-medium">Optimizar con IA</span> para generar análisis.
          </p>
        )}

        {/* Recommendation cards */}
        {recommendations.map((rec) => {
          const decision = rec.latest_decision
          const isApplied = decision?.decision === "accept"
          const isRejected = decision?.decision === "reject"
          const support = rec.platform_support
          const isManual = support === "manual_required" || support === "unsupported"

          return (
            <div
              key={rec.id}
              className={`p-4 rounded-lg border ${
                PRIORITY_BADGE[rec.priority] ?? PRIORITY_BADGE.medium
              } bg-white`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-base text-gray-900">{rec.title}</h4>
                    <Badge variant="outline">
                      {PRIORITY_LABELS[rec.priority] ?? rec.priority}
                    </Badge>
                    <Badge variant="outline" className="text-gray-600">
                      {ACTION_LABELS[rec.action_type] ?? rec.action_type}
                    </Badge>
                    {isApplied && (
                      <Badge className="bg-green-100 text-green-700">Aplicada</Badge>
                    )}
                    {isRejected && (
                      <Badge className="bg-gray-100 text-gray-700">Descartada</Badge>
                    )}
                    {isManual && (
                      <Badge className="bg-orange-100 text-orange-700">Manual</Badge>
                    )}
                  </div>
                </div>
              </div>

              {rec.rationale && (
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Por qué: </span>
                  {rec.rationale}
                </p>
              )}
              {rec.expected_impact && (
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Impacto esperado: </span>
                  {rec.expected_impact}
                </p>
              )}
              {Object.keys(rec.params || {}).length > 0 && (
                <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 mb-2">
                  <span className="font-medium">Parámetros: </span>
                  {Object.entries(rec.params)
                    .map(([k, v]) => `${k}=${String(v)}`)
                    .join(", ")}
                </div>
              )}
              {typeof rec.confidence === "number" && (
                <p className="text-xs text-gray-500 mb-3">
                  Confianza: {(rec.confidence * 100).toFixed(0)}%
                </p>
              )}

              {!decision && (
                <div className="flex gap-2 flex-wrap">
                  {isManual ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="text-orange-700 border-orange-300"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Aplicar manualmente en la plataforma
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleApply(rec, "accept")}
                      disabled={applyingId === rec.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {applyingId === rec.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                      )}
                      Aplicar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApply(rec, "reject")}
                    disabled={applyingId === rec.id}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Descartar
                  </Button>
                </div>
              )}
            </div>
          )
        })}

        {/* Next step callout */}
        {nextStep && (
          <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">Próximo paso: </span>
              {nextStep}
            </div>
          </div>
        )}

        {/* Run history */}
        {showHistory && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <History className="w-4 h-4" />
              Corridas anteriores
            </h4>
            {runs.length === 0 ? (
              <p className="text-sm text-gray-500">No hay corridas previas.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {runs.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className={
                          r.status === "succeeded"
                            ? "bg-green-100 text-green-700"
                            : r.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : r.status === "insufficient_data"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                        }
                      >
                        {r.status}
                      </Badge>
                      {typeof r.summary?.health_score === "number" && (
                        <span className="text-xs font-medium text-gray-600">
                          {r.summary.health_score}/100
                        </span>
                      )}
                      <span className="text-gray-700">
                        {r.summary?.headline ?? "(sin resumen)"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
