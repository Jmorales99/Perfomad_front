import { useNavigate, useParams, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { ArrowLeft, Sparkles, Download, ExternalLink, Loader2, AlertCircle, CheckCircle2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { importPlatformCampaign, checkImportStatus } from "@/infrastructure/api/platformRepository"
import type { Platform } from "@/infrastructure/api/campaignsRepository"
import type { NormalizedCampaignRow } from "@/interface/components/platforms/shared/GenericCampaignsTable"
import { useClient } from "@/app/providers/ClientProvider"
import { ApiError } from "@/infrastructure/api/errors"
import { fmtCurrency, fmtPct, fmtMultiplier } from "@/interface/components/platforms/shared/formatters"
import InlineAdSets from "@/interface/components/platforms/shared/InlineAdSets"

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta",
  "google-ads": "Google Ads",
  "google_ads": "Google Ads",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
}

function storageKey(platformKey: string, clientId: string) {
  return `${platformKey}_ad_account_${clientId}`
}

interface LocationState {
  campaignRow?: NormalizedCampaignRow
  clientId?: string
}

export default function PlatformCampaignDetailPage() {
  const { platform, platformCampaignId } = useParams<{
    platform: string
    platformCampaignId: string
  }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedClientId } = useClient()

  const state = location.state as LocationState | null
  const campaignRow = state?.campaignRow ?? null
  const platformLabel = platform ? (PLATFORM_LABELS[platform] ?? platform) : ""

  const adAccountId = platform && selectedClientId
    ? localStorage.getItem(storageKey(platform, selectedClientId)) ?? undefined
    : undefined

  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importedId, setImportedId] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!platform || !platformCampaignId) {
      setCheckingStatus(false)
      return
    }
    checkImportStatus(platform, platformCampaignId)
      .then((res) => {
        if (res.imported && res.campaign_id) {
          setImportedId(res.campaign_id)
        }
      })
      .catch(() => {})
      .finally(() => setCheckingStatus(false))
  }, [platform, platformCampaignId])

  const handleImport = async () => {
    if (!platform || !platformCampaignId || !selectedClientId) return
    setImporting(true)
    setImportError(null)
    try {
      const result = await importPlatformCampaign(platform as Platform, platformCampaignId, {
        clientId: selectedClientId,
        adAccountId,
      })
      setImportedId(result.id)
    } catch (e) {
      setImportError(e instanceof ApiError ? e.serverMessage ?? e.message : "Error al importar la campaña.")
    } finally {
      setImporting(false)
    }
  }

  const handleCopyId = () => {
    const id = campaignRow?.campaign_id ?? platformCampaignId ?? ""
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const statusDot = (status?: string | null) => {
    const s = (status ?? "").toLowerCase()
    const isActive = s === "active" || s === "enabled" || s === "eligible"
    const isPaused = s === "paused"
    return isActive ? "bg-green-500" : isPaused ? "bg-gray-400" : "bg-amber-500"
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/platforms/${platform}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {platformLabel}
        </Button>
        {campaignRow && (
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${statusDot(campaignRow.status)}`}
              title={campaignRow.status ?? ""}
            />
            <h1 className="text-xl font-bold text-gray-900">{campaignRow.campaign_name}</h1>
            {campaignRow.status && (
              <Badge variant="outline" className="text-xs">{campaignRow.status}</Badge>
            )}
          </div>
        )}
        {!campaignRow && platformCampaignId && (
          <h1 className="text-xl font-bold text-gray-900 font-mono text-sm text-gray-600">{platformCampaignId}</h1>
        )}
      </div>

      {/* Import banner */}
      {checkingStatus ? (
        <Card className="border-gray-100 bg-gray-50">
          <CardContent className="py-4 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Verificando estado de importación…
          </CardContent>
        </Card>
      ) : importedId ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800 font-medium">
                Campaña importada a Performad correctamente.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/campaigns/${importedId}`)}
              >
                Ver en Mis Campañas
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
                onClick={() => navigate(`/optimize/${importedId}`)}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Optimizar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Importar a Performad
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Importa esta campaña nativa para acceder a optimización con IA e historial de ventas.
                </p>
                {importError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {importError}
                  </p>
                )}
              </div>
              <Button
                onClick={handleImport}
                disabled={importing || !selectedClientId}
                className="bg-blue-600 hover:bg-blue-700 shrink-0"
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-1" />
                    Importar campaña
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign metrics from table row */}
      {campaignRow ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información de la campaña</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">ID nativo</span>
                <span className="flex items-center gap-1">
                  <span className="font-mono text-xs text-gray-700 truncate max-w-[180px]">{campaignRow.campaign_id}</span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copiar ID"
                  >
                    {copied ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado</span>
                <span className="font-medium">{campaignRow.status ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Plataforma</span>
                <span className="font-medium">{platformLabel}</span>
              </div>
              {(campaignRow as any).objective && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Objetivo</span>
                  <span className="font-medium text-xs">{(campaignRow as any).objective}</span>
                </div>
              )}
              {(campaignRow as any).daily_budget != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Presupuesto diario</span>
                  <span className="font-medium">{fmtCurrency((campaignRow as any).daily_budget, "USD")}</span>
                </div>
              )}
              {(campaignRow as any).lifetime_budget != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Presupuesto total</span>
                  <span className="font-medium">{fmtCurrency((campaignRow as any).lifetime_budget, "USD")}</span>
                </div>
              )}
              {(campaignRow as any).start_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Inicio</span>
                  <span className="font-medium">{new Date((campaignRow as any).start_date).toLocaleDateString("es-CL")}</span>
                </div>
              )}
              {(campaignRow as any).end_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Fin</span>
                  <span className="font-medium">{new Date((campaignRow as any).end_date).toLocaleDateString("es-CL")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Métricas del período</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Gasto</span>
                <span className="font-semibold">{fmtCurrency(campaignRow.spend, "USD")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Impresiones</span>
                <span className="font-semibold">{campaignRow.impressions?.toLocaleString() ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Clics</span>
                <span className="font-semibold">{campaignRow.clicks?.toLocaleString() ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">CTR</span>
                <span className="font-semibold">{fmtPct(campaignRow.ctr)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">CPC</span>
                <span className="font-semibold">{fmtCurrency(campaignRow.cpc, "USD")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Conversiones</span>
                <span className="font-semibold">{campaignRow.conversions?.toLocaleString() ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ROAS</span>
                <span className="font-semibold">{fmtMultiplier(campaignRow.roas)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500 text-sm">
            <p>ID de campaña nativa: <span className="font-mono font-medium">{platformCampaignId}</span></p>
            <p className="mt-2 text-gray-400">
              Navega a esta página desde la tabla de campañas de {platformLabel} para ver más detalles.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate(`/platforms/${platform}`)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ir a {platformLabel}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Creatives section */}
      {importedId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Creativos</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-lg">
            <table className="w-full">
              <tbody>
                <InlineAdSets
                  campaignId={importedId}
                  clientId={selectedClientId ?? undefined}
                  platform={platform as "meta" | "google_ads" | "linkedin" | "tiktok"}
                  colSpan={1}
                />
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : !checkingStatus && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-sm text-gray-400">
            Importa esta campaña para ver los creativos y acceder a optimización con IA.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
