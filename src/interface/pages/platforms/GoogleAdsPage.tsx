import { useEffect, useState, useCallback } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useClient } from "@/app/providers/ClientProvider"
import { useSubscriptionGate } from "@/interface/hooks/useSubscriptionGate"
import {
  getGoogleAdsAdAccounts,
  getGoogleAdsMetrics,
  getGoogleAdsCampaigns,
  getGoogleAdsAds,
  getGoogleAdsConnectLink,
  type GoogleAdsAdAccount,
  type GoogleAdsMetrics,
  type GoogleAdsCampaign,
  type GoogleAdsAd,
} from "@/infrastructure/repositories/integrations/googleAdsRepository"
import { ApiError, isReconnectError } from "@/infrastructure/api/errors"
import { StatusFilter, matchesStatusFilter, type StatusFilterValue } from "@/interface/components/StatusFilter"
import { MetricTooltip } from "@/interface/components/MetricTooltip"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  RefreshCw,
  Eye,
  MousePointerClick,
  DollarSign,
  AlertCircle,
  Link2,
  Building2,
  Loader2,
  TrendingUp,
  Percent,
  Search,
  ChevronUp,
  ChevronDown,
  X,
  FileText,
} from "lucide-react"

// ── Helpers ────────────────────────────────────────────────────────────────────

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function defaultSince() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return toISODate(d)
}

function defaultUntil() {
  return toISODate(new Date())
}

function adAccountKey(clientId: string) {
  return `google_ads_ad_account_${clientId}`
}

function toNum(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

function fmt(n: unknown, decimals = 0) {
  const num = toNum(n)
  if (num === null) return "—"
  return num.toLocaleString("es-CL", { maximumFractionDigits: decimals })
}

function fmtCurrency(n: unknown, currency = "USD") {
  const num = toNum(n)
  if (num === null) return "—"
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(num)
}

function fmtPct(n: unknown, decimals = 2): string {
  const num = toNum(n)
  if (num === null) return "—"
  return `${num.toFixed(decimals)}%`
}

function fmtMultiplier(n: unknown, decimals = 2): string {
  const num = toNum(n)
  if (num === null) return "—"
  return `${num.toFixed(decimals)}x`
}

type SortField = "spend" | "roas" | "impressions" | "conversions"

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent = "blue",
}: {
  label: React.ReactNode
  value: string
  sub?: string
  icon: React.ReactNode
  accent?: "blue" | "green" | "purple" | "orange" | "red"
}) {
  const colors: Record<string, string> = {
    blue:   "text-blue-600 bg-blue-50",
    green:  "text-green-600 bg-green-50",
    purple: "text-purple-600 bg-purple-50",
    orange: "text-orange-600 bg-orange-50",
    red:    "text-red-600 bg-red-50",
  }
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors[accent]}`}>
            {icon}
          </div>
        </div>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function SectionSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-gray-100" />
      ))}
    </div>
  )
}

// ── AdCard (Google Ads) ────────────────────────────────────────────────────────

function GoogleAdCard({
  ad,
  currency,
}: {
  ad: GoogleAdsAd
  currency: string
}) {
  const creative                = ad.creative
  const headlines: string[]    = (creative as any)?.headlines    ?? []
  const descriptions: string[] = (creative as any)?.descriptions ?? []
  const finalUrls: string[]    = (creative as any)?.final_urls   ?? []
  const adType: string         = (creative as any)?.ad_type      ?? ""

  const hasMedia =
    creative?.type === "image" ||
    creative?.type === "video" ||
    creative?.type === "carousel"

  const previewUrl  = creative?.thumbnail_url ?? creative?.image_url ?? null
  const videoUrl    = (creative as any)?.video_url as string | null | undefined
  const carouselCards = creative?.type === "carousel" ? (creative?.cards ?? []) : []

  const metrics = [
    { label: "Gasto",    value: fmtCurrency(ad.spend, currency),   show: ad.spend       != null },
    { label: "Clics",    value: fmt(ad.clicks),                     show: ad.clicks      != null },
    { label: "CTR",      value: fmtPct(ad.ctr),                     show: ad.ctr         != null },
    { label: "Conv.",    value: fmt(ad.conversions),                 show: ad.conversions != null },
    { label: "ROAS",     value: fmtMultiplier(ad.roas),             show: ad.roas        != null },
    { label: "Ingresos", value: fmtCurrency(ad.revenue, currency),  show: (toNum(ad.revenue) ?? 0) > 0 },
  ].filter((m) => m.show)

  const adTypeLabel = adType
    .replace("RESPONSIVE_SEARCH_AD",    "Búsqueda Responsive")
    .replace("EXPANDED_TEXT_AD",        "Texto Expandido")
    .replace("RESPONSIVE_DISPLAY_AD",   "Display Responsive")
    .replace("IMAGE_AD",                "Imagen")
    .replace("VIDEO_AD",                "Video")
    .replace("CALL_AD",                 "Llamada")
    .replace("PERFORMANCE_MAX",         "Performance Max")
    .replace("UNKNOWN",                 "")
    || ""

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-lg transition-shadow flex flex-col">
      {/* Header: ad type + status */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="text-xs font-medium text-gray-600 truncate max-w-[140px]">
            {adTypeLabel || "Anuncio"}
          </span>
        </div>
        {ad.status && ad.status !== "ENABLED" && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
            {ad.status}
          </span>
        )}
      </div>

      {/* Media preview — only when available */}
      {hasMedia && (
        <div className="relative w-full bg-gray-100">
          {/* Carousel */}
          {creative?.type === "carousel" && carouselCards.length > 0 && (
            <div className="flex gap-1 overflow-x-auto p-1 scrollbar-none">
              {carouselCards.map((card, i) =>
                card.thumbnail_url ? (
                  <img
                    key={i}
                    src={card.thumbnail_url}
                    alt={`Slide ${i + 1}`}
                    loading="lazy"
                    className="h-28 w-28 object-cover rounded shrink-0"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = "none"
                    }}
                  />
                ) : null
              )}
            </div>
          )}

          {/* Video — show YouTube thumbnail + link */}
          {creative?.type === "video" && previewUrl && (
            <a
              href={videoUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative"
            >
              <img
                src={previewUrl}
                alt="Vista previa de video"
                loading="lazy"
                className="w-full aspect-video object-cover"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).closest("a")?.remove()
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-600 ml-0.5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </a>
          )}

          {/* Single image */}
          {creative?.type === "image" && previewUrl && (
            <img
              src={previewUrl}
              alt="Vista previa del anuncio"
              loading="lazy"
              className="w-full aspect-video object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = "none"
              }}
            />
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Ad name */}
        <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2" title={ad.name}>
          {ad.name || "Sin nombre"}
        </p>

        {/* Headlines */}
        {headlines.length > 0 && (
          <div className="space-y-0.5">
            {headlines.slice(0, 3).map((h, i) => (
              <p key={i} className="text-xs text-blue-700 font-medium line-clamp-1" title={h}>
                {h}
              </p>
            ))}
          </div>
        )}

        {/* Descriptions */}
        {descriptions.length > 0 && (
          <div className="space-y-0.5">
            {descriptions.slice(0, 2).map((d, i) => (
              <p key={i} className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed" title={d}>
                {d}
              </p>
            ))}
          </div>
        )}

        {/* No visual preview note for text ads */}
        {!hasMedia && headlines.length === 0 && descriptions.length === 0 && (
          <p className="text-[11px] text-gray-400 italic">Sin vista previa disponible.</p>
        )}

        {/* Final URL */}
        {finalUrls.length > 0 && (
          <p className="text-[10px] text-green-700 truncate" title={finalUrls[0]}>
            {finalUrls[0]}
          </p>
        )}

        {/* Metrics */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 mt-auto pt-2 border-t border-gray-100">
            {metrics.map((m) => (
              <div key={m.label}>
                <p className="text-[10px] text-gray-400">{m.label}</p>
                <p className="text-xs font-semibold text-gray-700">{m.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── AdsModal ──────────────────────────────────────────────────────────────────

function AdsModal({
  campaign,
  ads,
  loading,
  error,
  currency,
  onClose,
  onRetry,
}: {
  campaign: GoogleAdsCampaign | null
  ads: GoogleAdsAd[]
  loading: boolean
  error: string | null
  currency: string
  onClose: () => void
  onRetry: () => void
}) {
  useEffect(() => {
    if (!campaign) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [campaign, onClose])

  if (!campaign) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-8 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl">
          <div className="min-w-0 mr-4">
            <h2 className="text-base font-bold text-gray-900">Anuncios de la campaña</h2>
            <p className="text-sm text-gray-500 truncate max-w-lg">{campaign.campaign_name}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-gray-100 h-48" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 space-y-2">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Error al cargar anuncios</p>
                  <p className="text-xs text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
              <button onClick={onRetry} className="ml-8 text-xs text-red-700 underline">
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && ads.length === 0 && (
            <div className="text-center py-14 px-6 space-y-2">
              <FileText className="w-10 h-10 mx-auto mb-1 text-gray-200" />
              <p className="text-sm font-medium text-gray-500">Sin anuncios individuales disponibles</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                No hay anuncios para el período seleccionado, o esta campaña es de tipo
                Performance Max — que gestiona los creativos como grupos de recursos y no
                expone anuncios individuales en esta vista.
              </p>
            </div>
          )}

          {!loading && !error && ads.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-400">
                  {ads.length} anuncio{ads.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {ads.map((ad) => (
                  <GoogleAdCard
                    key={ad.id || ad.name}
                    ad={ad}
                    currency={currency}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── CampaignsTable ────────────────────────────────────────────────────────────

function CampaignsTable({
  campaigns,
  loading,
  error,
  currency,
  onRetry,
  onReconnect,
  onViewAds,
}: {
  campaigns: GoogleAdsCampaign[]
  loading: boolean
  error: string | null
  currency: string
  onRetry: () => void
  onReconnect?: () => void
  onViewAds?: (c: GoogleAdsCampaign) => void
}) {
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("spend")
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const filtered = campaigns
    .filter((c) => (c.campaign_name ?? "").toLowerCase().includes(search.toLowerCase()))
    .filter((c) => matchesStatusFilter(c.status, statusFilter))
    .sort((a, b) => {
      let av: number
      let bv: number
      if (sortField === "roas") {
        av = toNum(a.roas) ?? -1
        bv = toNum(b.roas) ?? -1
      } else if (sortField === "impressions") {
        av = toNum(a.impressions) ?? 0
        bv = toNum(b.impressions) ?? 0
      } else if (sortField === "conversions") {
        av = toNum(a.conversions) ?? 0
        bv = toNum(b.conversions) ?? 0
      } else {
        av = toNum(a.spend) ?? 0
        bv = toNum(b.spend) ?? 0
      }
      return sortDir === "desc" ? bv - av : av - bv
    })

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30 inline ml-0.5" />
    return sortDir === "desc"
      ? <ChevronDown className="w-3 h-3 text-red-600 inline ml-0.5" />
      : <ChevronUp className="w-3 h-3 text-red-600 inline ml-0.5" />
  }

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800">Error al cargar campañas</p>
          <p className="text-xs text-red-600 mt-0.5">{error}</p>
          {onReconnect ? (
            <button onClick={onReconnect} className="mt-2 text-xs font-medium text-red-700 underline">
              Reconectar Google Ads
            </button>
          ) : (
            <button onClick={onRetry} className="mt-2 text-xs text-red-700 underline">
              Reintentar
            </button>
          )}
        </div>
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        Sin campañas para el período y cuenta seleccionados.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search + Status filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar campaña..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>
        <StatusFilter value={statusFilter} onChange={setStatusFilter} accentColor="red" />
        <span className="text-xs text-gray-400">{filtered.length} campañas</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 py-2.5 font-medium text-gray-600 min-w-[180px]">
                Campaña
              </th>
              <th
                className="text-right px-3 py-2.5 font-medium text-gray-600 cursor-pointer whitespace-nowrap select-none"
                onClick={() => handleSort("spend")}
              >
                <MetricTooltip metric="spend">Gasto</MetricTooltip> <SortIcon field="spend" />
              </th>
              <th
                className="text-right px-3 py-2.5 font-medium text-gray-600 cursor-pointer whitespace-nowrap select-none"
                onClick={() => handleSort("impressions")}
              >
                <MetricTooltip metric="imp">Imp.</MetricTooltip> <SortIcon field="impressions" />
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600 whitespace-nowrap">
                <MetricTooltip metric="clicks">Clics</MetricTooltip>
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600 whitespace-nowrap">
                <MetricTooltip metric="ctr">CTR</MetricTooltip>
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600 whitespace-nowrap">
                <MetricTooltip metric="cpc">CPC</MetricTooltip>
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600 whitespace-nowrap">
                <MetricTooltip metric="cpm">CPM</MetricTooltip>
              </th>
              <th
                className="text-right px-3 py-2.5 font-medium text-gray-600 cursor-pointer whitespace-nowrap select-none"
                onClick={() => handleSort("conversions")}
              >
                <MetricTooltip metric="conversions">Conv.</MetricTooltip> <SortIcon field="conversions" />
              </th>
              <th
                className="text-right px-3 py-2.5 font-medium text-gray-600 cursor-pointer whitespace-nowrap select-none"
                onClick={() => handleSort("roas")}
              >
                <MetricTooltip metric="roas">ROAS</MetricTooltip> <SortIcon field="roas" />
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600 whitespace-nowrap">
                <MetricTooltip metric="revenue">Ingresos</MetricTooltip>
              </th>
              {onViewAds && <th className="px-3 py-2.5 w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <tr key={c.campaign_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 font-medium text-gray-800">
                  <div className="flex items-center gap-1.5">
                    {c.status && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          c.status === "active" || c.status === "ENABLED" ? "bg-green-500"
                          : c.status === "paused" || c.status === "PAUSED" ? "bg-gray-400"
                          : "bg-gray-300"
                        }`}
                      />
                    )}
                    <span className="truncate max-w-[200px]" title={c.campaign_name}>
                      {c.campaign_name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                  {fmtCurrency(c.spend, currency)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                  {fmt(c.impressions)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                  {fmt(c.clicks)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                  {fmtPct(c.ctr)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                  {fmtCurrency(c.cpc, currency)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                  {fmtCurrency(c.cpm, currency)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                  {fmt(c.conversions)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                  {fmtMultiplier(c.roas)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                  {(toNum(c.revenue) ?? 0) > 0 ? fmtCurrency(c.revenue, currency) : "—"}
                </td>
                {onViewAds && (
                  <td className="px-2 py-2.5">
                    <button
                      onClick={() => onViewAds(c)}
                      title="Ver anuncios"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && search && (
        <p className="text-xs text-center text-gray-400">
          Sin resultados para "{search}"
        </p>
      )}
      <p className="text-xs text-gray-400">
        {filtered.length} de {campaigns.length} campaña{campaigns.length !== 1 ? "s" : ""}
      </p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GoogleAdsPage() {
  const navigate = useNavigate()
  const { selectedClientId, selectedClient } = useClient()
  const { canAct, openPaywall, PaywallModal } = useSubscriptionGate()

  // ── Ad accounts ─────────────────────────────────────────────────────────────
  const [accounts, setAccounts]                 = useState<GoogleAdsAdAccount[]>([])
  const [accountsLoading, setAccountsLoading]   = useState(false)
  const [accountsError, setAccountsError]       = useState<string | null>(null)
  const [selectedAdAccountId, setSelectedAdAccountId] = useState<string | null>(null)

  // ── Date range ──────────────────────────────────────────────────────────────
  const [since, setSince] = useState(defaultSince)
  const [until, setUntil] = useState(defaultUntil)

  // ── Metrics ─────────────────────────────────────────────────────────────────
  const [metrics, setMetrics]           = useState<GoogleAdsMetrics | null>(null)
  const [currency, setCurrency]         = useState("USD")
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [metricsError, setMetricsError]     = useState<string | null>(null)

  // ── Campaigns ────────────────────────────────────────────────────────────────
  const [campaigns, setCampaigns]                     = useState<GoogleAdsCampaign[]>([])
  const [campaignsLoading, setCampaignsLoading]       = useState(false)
  const [campaignsError, setCampaignsError]           = useState<string | null>(null)

  // ── Ads modal ────────────────────────────────────────────────────────────────
  const [selectedCampaign, setSelectedCampaign] = useState<GoogleAdsCampaign | null>(null)
  const [ads, setAds]                           = useState<GoogleAdsAd[]>([])
  const [adsLoading, setAdsLoading]             = useState(false)
  const [adsError, setAdsError]                 = useState<string | null>(null)

  // ── Connect ──────────────────────────────────────────────────────────────────
  const [connecting, setConnecting] = useState(false)

  // ── Reconnect flags (token revoked) ─────────────────────────────────────────
  const [metricsNeedsReconnect, setMetricsNeedsReconnect] = useState(false)
  const [campaignsNeedsReconnect, setCampaignsNeedsReconnect] = useState(false)

  // ── Load accounts when client changes ───────────────────────────────────────
  const loadAccounts = useCallback(async (clientId: string) => {
    setAccountsLoading(true)
    setAccountsError(null)
    setAccounts([])
    setSelectedAdAccountId(null)
    setMetrics(null)
    try {
      const list = await getGoogleAdsAdAccounts(clientId)
      const active = list.filter((a) => a.is_active !== false)
      setAccounts(active)

      const saved = localStorage.getItem(adAccountKey(clientId))
      const savedExists = saved && active.some((a) => a.platform_account_id === saved)

      if (savedExists) {
        setSelectedAdAccountId(saved!)
      } else if (active.length === 1) {
        const pid = active[0].platform_account_id
        setSelectedAdAccountId(pid)
        localStorage.setItem(adAccountKey(clientId), pid)
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === "subscription_required") {
        openPaywall()
      } else if (err instanceof ApiError) {
        setAccountsError(err.serverMessage || err.message)
      } else {
        setAccountsError("Error al cargar cuentas de Google Ads.")
      }
    } finally {
      setAccountsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedClientId) loadAccounts(selectedClientId)
  }, [selectedClientId, loadAccounts])

  // ── Load metrics ─────────────────────────────────────────────────────────────
  const loadMetrics = useCallback(async () => {
    if (!selectedClientId || !selectedAdAccountId) return
    setMetricsLoading(true)
    setMetricsError(null)
    setMetricsNeedsReconnect(false)
    try {
      const res = await getGoogleAdsMetrics({
        clientId: selectedClientId,
        adAccountId: selectedAdAccountId,
        since,
        until,
      })
      setMetrics(res.metrics)
      if (res.currency) setCurrency(res.currency)
      else if (selectedAccount?.currency) setCurrency(selectedAccount.currency)
    } catch (err) {
      if (err instanceof ApiError && err.code === "subscription_required") {
        openPaywall()
      } else if (err instanceof ApiError) {
        setMetricsNeedsReconnect(isReconnectError(err))
        setMetricsError(err.serverMessage || err.message)
      } else {
        setMetricsNeedsReconnect(isReconnectError(err))
        setMetricsError("Error al cargar métricas.")
      }
    } finally {
      setMetricsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId, selectedAdAccountId, since, until])

  useEffect(() => {
    if (selectedAdAccountId) loadMetrics()
  }, [selectedAdAccountId, loadMetrics])

  // ── Load campaigns ───────────────────────────────────────────────────────────
  const loadCampaigns = useCallback(async () => {
    if (!selectedClientId || !selectedAdAccountId) return
    setCampaignsLoading(true)
    setCampaignsError(null)
    setCampaignsNeedsReconnect(false)
    try {
      const res = await getGoogleAdsCampaigns({
        clientId: selectedClientId,
        adAccountId: selectedAdAccountId,
        since,
        until,
      })
      setCampaigns(res.campaigns ?? [])
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "subscription_required") {
          openPaywall()
        } else if (err.code === "oauth_reconnect_required") {
          setCampaignsNeedsReconnect(true)
          setCampaignsError(err.serverMessage || err.message)
        } else if (err.status === 400) {
          setCampaignsError("Selecciona una cuenta publicitaria para ver campañas.")
        } else if (err.code === "not_found") {
          setCampaigns([])
        } else {
          setCampaignsNeedsReconnect(isReconnectError(err))
          setCampaignsError(err.serverMessage || err.message)
        }
      } else {
        setCampaignsNeedsReconnect(isReconnectError(err))
        setCampaignsError("Error al cargar campañas.")
      }
    } finally {
      setCampaignsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId, selectedAdAccountId, since, until])

  useEffect(() => {
    if (selectedAdAccountId) loadCampaigns()
  }, [selectedAdAccountId, loadCampaigns])

  // ── Load ads for a campaign ──────────────────────────────────────────────────
  const loadAds = useCallback(async (campaign: GoogleAdsCampaign) => {
    if (!selectedClientId) return
    setAdsLoading(true)
    setAdsError(null)
    setAds([])
    try {
      const res = await getGoogleAdsAds({
        campaignId: campaign.campaign_id,
        clientId: selectedClientId,
        adAccountId: selectedAdAccountId ?? undefined,
        since,
        until,
      })
      setAds(res.ads ?? [])
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "subscription_required") {
          openPaywall()
          setSelectedCampaign(null)
        } else {
          setAdsError(err.serverMessage || err.message)
        }
      } else {
        setAdsError("Error al cargar anuncios.")
      }
    } finally {
      setAdsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId, selectedAdAccountId, since, until])

  const handleViewAds = (campaign: GoogleAdsCampaign) => {
    setSelectedCampaign(campaign)
    loadAds(campaign)
  }

  const handleCloseAds = () => {
    setSelectedCampaign(null)
    setAds([])
    setAdsError(null)
  }

  const handleSelectAccount = (platformAccountId: string) => {
    setSelectedAdAccountId(platformAccountId)
    if (selectedClientId) localStorage.setItem(adAccountKey(selectedClientId), platformAccountId)
  }

  // ── Connect / Reconnect Google Ads ──────────────────────────────────────────
  const handleConnect = async () => {
    if (!selectedClientId) { navigate("/brands"); return }
    if (!canAct) { openPaywall(); return }
    setConnecting(true)
    try {
      // Always return to this page after OAuth so metrics reload automatically.
      const redirectUri = window.location.href
      const { url } = await getGoogleAdsConnectLink(selectedClientId, redirectUri)
      window.location.href = url
    } catch (err) {
      if (err instanceof ApiError && err.code === "subscription_required") {
        openPaywall()
      }
      setConnecting(false)
    }
  }

  // ── Handle OAuth return (connect=success|error in query string) ──────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const connect = params.get("connect")
    if (!connect) return
    // Clean the URL so a hard-reload doesn't re-trigger this
    window.history.replaceState(null, "", window.location.pathname)
    if (connect === "success" && selectedClientId) {
      void loadAccounts(selectedClientId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!selectedClientId) {
    return (
      <div className="p-6 max-w-lg">
        <Button variant="ghost" onClick={() => navigate("/home")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Building2 className="w-12 h-12 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-700">Sin marca seleccionada</h2>
          <p className="text-sm text-gray-500 max-w-xs">
            Selecciona o crea una marca para ver las métricas de Google Ads asociadas.
          </p>
          <Link to="/brands">
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              Ir a Marcas
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const selectedAccount = accounts.find((a) => a.platform_account_id === selectedAdAccountId)

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <PaywallModal />
      <AdsModal
        campaign={selectedCampaign}
        ads={ads}
        loading={adsLoading}
        error={adsError}
        currency={currency}
        onClose={handleCloseAds}
        onRetry={() => selectedCampaign && loadAds(selectedCampaign)}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/home")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Google Ads</h1>
            <p className="text-sm text-gray-500">
              Marca:{" "}
              <span className="font-medium text-gray-700">{selectedClient?.name}</span>
            </p>
          </div>
        </div>

        {/* Controls: account selector + date range + refresh */}
        {accounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {accounts.length > 1 && (
              <select
                value={selectedAdAccountId ?? ""}
                onChange={(e) => handleSelectAccount(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <option value="" disabled>Cuenta publicitaria</option>
                {accounts.map((a) => (
                  <option key={a.platform_account_id} value={a.platform_account_id}>
                    {a.account_name ?? a.platform_account_id}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1.5 text-sm">
              <input
                type="date"
                value={since}
                max={until}
                onChange={(e) => setSince(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={until}
                min={since}
                max={toISODate(new Date())}
                onChange={(e) => setUntil(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => { loadMetrics(); loadCampaigns() }}
              disabled={(metricsLoading || campaignsLoading) || !selectedAdAccountId}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${metricsLoading || campaignsLoading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        )}
      </div>

      {/* Loading accounts */}
      {accountsLoading && (
        <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando cuentas de Google Ads...</span>
        </div>
      )}

      {/* Accounts error */}
      {accountsError && !accountsLoading && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error al cargar cuentas</p>
            <p className="text-xs text-red-600 mt-0.5">{accountsError}</p>
            <button
              onClick={() => loadAccounts(selectedClientId)}
              className="mt-2 text-xs text-red-700 underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* No accounts connected */}
      {!accountsLoading && !accountsError && accounts.length === 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Conecta tu cuenta de Google Ads
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  No hay cuentas publicitarias conectadas para{" "}
                  <strong>{selectedClient?.name}</strong>. Completa el proceso OAuth para
                  importar tus campañas y ver métricas reales.
                </p>
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  {connecting ? "Redirigiendo..." : "Conectar Google Ads"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected account badge */}
      {!accountsLoading && accounts.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            {selectedAccount ? (
              <span>
                <strong>{selectedAccount.account_name ?? selectedAccount.platform_account_id}</strong>
                {selectedAccount.currency && (
                  <span className="text-gray-400 ml-1">· {selectedAccount.currency}</span>
                )}
              </span>
            ) : (
              <span className="text-gray-500">Selecciona una cuenta</span>
            )}
          </div>
          {accounts.length === 1 && (
            <span className="text-xs text-gray-400">1 cuenta conectada</span>
          )}
          {accounts.length > 1 && (
            <span className="text-xs text-gray-400">{accounts.length} cuentas disponibles</span>
          )}
        </div>
      )}

      {/* Multiple accounts, none selected */}
      {!accountsLoading && accounts.length > 1 && !selectedAdAccountId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Selecciona una cuenta publicitaria en el selector de arriba para ver métricas.
        </div>
      )}

      {/* Metrics + campaigns */}
      {selectedAdAccountId && (
        <>
          {metricsLoading && <SectionSkeleton />}

          {metricsError && !metricsLoading && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error al cargar métricas</p>
                <p className="text-xs text-red-600 mt-0.5">{metricsError}</p>
                <div className="flex items-center gap-3 mt-2">
                  {metricsNeedsReconnect && (
                    <button
                      onClick={handleConnect}
                      disabled={connecting}
                      className="text-xs font-medium text-red-700 underline"
                    >
                      {connecting ? "Redirigiendo…" : "Reconectar Google Ads"}
                    </button>
                  )}
                  <button onClick={loadMetrics} className="text-xs text-red-600 underline">
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          )}

          {!metricsLoading && !metricsError && metrics && (
            <>
              {/* Row 1: spend + volume */}
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Rendimiento del período
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard
                    label={<MetricTooltip metric="spend">Gasto</MetricTooltip>}
                    value={fmtCurrency(metrics.spend, currency)}
                    icon={<DollarSign className="w-4 h-4" />}
                    accent="green"
                  />
                  <KpiCard
                    label={<MetricTooltip metric="impressions">Impresiones</MetricTooltip>}
                    value={fmt(metrics.impressions)}
                    icon={<Eye className="w-4 h-4" />}
                    accent="blue"
                  />
                  <KpiCard
                    label={<MetricTooltip metric="clicks">Clics</MetricTooltip>}
                    value={fmt(metrics.clicks)}
                    sub={metrics.ctr != null ? `CTR ${fmtPct(metrics.ctr)}` : undefined}
                    icon={<MousePointerClick className="w-4 h-4" />}
                    accent="purple"
                  />
                  <KpiCard
                    label={<MetricTooltip metric="conversions">Conversiones</MetricTooltip>}
                    value={fmt(metrics.conversions ?? 0)}
                    sub={metrics.revenue != null && (toNum(metrics.revenue) ?? 0) > 0
                      ? `Ingresos: ${fmtCurrency(metrics.revenue, currency)}`
                      : undefined}
                    icon={<TrendingUp className="w-4 h-4" />}
                    accent="orange"
                  />
                </div>
              </div>

              {/* Row 2: efficiency */}
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Eficiencia
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard
                    label={<MetricTooltip metric="cpc">CPC</MetricTooltip>}
                    value={fmtCurrency(metrics.cpc, currency)}
                    sub="Costo por clic"
                    icon={<MousePointerClick className="w-4 h-4" />}
                    accent="blue"
                  />
                  <KpiCard
                    label={<MetricTooltip metric="cpm">CPM</MetricTooltip>}
                    value={fmtCurrency(metrics.cpm, currency)}
                    sub="Costo por mil imp."
                    icon={<DollarSign className="w-4 h-4" />}
                    accent="purple"
                  />
                  <KpiCard
                    label={<MetricTooltip metric="ctr">CTR</MetricTooltip>}
                    value={fmtPct(metrics.ctr)}
                    sub="Tasa de clics"
                    icon={<Percent className="w-4 h-4" />}
                    accent="orange"
                  />
                  <KpiCard
                    label={<MetricTooltip metric="roas">ROAS</MetricTooltip>}
                    value={fmtMultiplier(metrics.roas)}
                    sub={
                      metrics.revenue != null && (toNum(metrics.revenue) ?? 0) > 0
                        ? `Ingresos: ${fmtCurrency(metrics.revenue, currency)}`
                        : undefined
                    }
                    icon={<TrendingUp className="w-4 h-4" />}
                    accent="green"
                  />
                </div>
              </div>

              {/* Row 3: conversions detail (if any) */}
              {(metrics.cpa != null) && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Conversiones
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {metrics.cpa != null && (
                      <KpiCard
                        label={<MetricTooltip metric="cpa">CPA</MetricTooltip>}
                        value={fmtCurrency(metrics.cpa, currency)}
                        sub="Costo por conversión"
                        icon={<DollarSign className="w-4 h-4" />}
                        accent="red"
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {!metricsLoading && !metricsError && !metrics && (
            <div className="text-center py-12 text-gray-400 text-sm">
              Sin datos para el período seleccionado.
            </div>
          )}

          {/* Campaigns */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Campañas
            </h2>
            <CampaignsTable
              campaigns={campaigns}
              loading={campaignsLoading}
              error={campaignsError}
              currency={currency}
              onRetry={loadCampaigns}
              onReconnect={campaignsNeedsReconnect ? handleConnect : undefined}
              onViewAds={handleViewAds}
            />
          </div>
        </>
      )}
    </div>
  )
}
