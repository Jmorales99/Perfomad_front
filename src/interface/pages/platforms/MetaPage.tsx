import { useEffect, useState, useCallback } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useClient } from "@/app/providers/ClientProvider"
import { useSubscriptionGate } from "@/interface/hooks/useSubscriptionGate"
import {
  getMetaAdAccounts,
  getMetaMetrics,
  getMetaCampaigns,
  getMetaAds,
  getMetaConnectLink,
  type MetaAdAccount,
  type MetaMetrics,
  type MetaCampaign,
  type MetaAd,
} from "@/infrastructure/repositories/integrations/metaRepository"
import { ApiError } from "@/infrastructure/api/errors"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Users,
  Percent,
  Search,
  ChevronUp,
  ChevronDown,
  Info,
  X,
  Play,
  Film,
  Image as ImageIcon,
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
  return `meta_ad_account_${clientId}`
}

// Coerce value to number safely (Meta API returns many numbers as strings)
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

// Suma las acciones cuyo action_type contiene "purchase" (ej. offsite_conversion.fb_pixel_purchase)
function altPurchaseCount(actions?: MetaCampaign["actions"]): number {
  if (!actions) return 0
  return actions
    .filter((a) => a.action_type.toLowerCase().includes("purchase"))
    .reduce((sum, a) => sum + Number(a.value || 0), 0)
}

type SortField = "spend" | "roas" | "impressions" | "conversions"

// ── AdCard ─────────────────────────────────────────────────────────────────────

const FORMAT_COLORS: Record<string, string> = {
  image:    "bg-blue-600",
  video:    "bg-purple-600",
  carousel: "bg-orange-500",
}

type LightboxContent = { url: string; isVideo: boolean }

function AdCard({
  ad,
  currency,
  onExpand,
}: {
  ad: MetaAd
  currency: string
  onExpand?: (content: LightboxContent) => void
}) {
  const [imgError, setImgError] = useState(false)

  const videoUrl = ad.creative?.video_url
  const thumb    = ad.creative?.thumbnail_url || ad.creative?.image_url
  const showThumb = !!thumb && !imgError
  const fmt_key  = (ad.format ?? (videoUrl ? "video" : "")).toLowerCase()
  const isVideo    = fmt_key.includes("video") || !!videoUrl
  const isCarousel = fmt_key.includes("carousel")
  const badgeColor = FORMAT_COLORS[fmt_key] ?? "bg-gray-500"

  const creativeTitle = ad.creative?.title
  const creativeBody  = ad.creative?.body

  const metrics = [
    { label: "Gasto",    value: fmtCurrency(ad.spend, currency),  show: ad.spend     != null },
    { label: "Clics",    value: fmt(ad.clicks),                    show: ad.clicks    != null },
    { label: "CTR",      value: fmtPct(ad.ctr),                    show: ad.ctr       != null },
    { label: "Conv.",    value: fmt(ad.conversions),                show: ad.conversions != null },
    { label: "ROAS",     value: fmtMultiplier(ad.roas),            show: ad.roas      != null },
    { label: "Ingresos", value: fmtCurrency(ad.revenue, currency), show: (toNum(ad.revenue) ?? 0) > 0 },
  ].filter((m) => m.show)

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-lg transition-shadow flex flex-col group">
      {/* Thumbnail */}
      <div
        className={`relative bg-gray-100 overflow-hidden ${(showThumb || videoUrl) && onExpand ? "cursor-pointer" : ""}`}
        style={{ aspectRatio: "16/9" }}
        onClick={() => {
          if (!onExpand) return
          if (videoUrl) { onExpand({ url: videoUrl, isVideo: true }); return }
          if (showThumb) onExpand({ url: thumb!, isVideo: false })
        }}
      >
        {showThumb ? (
          <>
            <img
              src={thumb}
              alt={ad.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
            {/* Hover overlay */}
            {onExpand && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity w-12 h-12 rounded-full bg-black/65 flex items-center justify-center">
                  {videoUrl
                    ? <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                    : <Eye className="w-5 h-5 text-white" />}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Placeholder when no thumbnail or image load failed */
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4 text-center">
            {isVideo
              ? <Film className="w-10 h-10 text-gray-300" />
              : <ImageIcon className="w-10 h-10 text-gray-300" />}
            <span className="text-[11px] text-gray-400 leading-tight max-w-[140px]">
              {imgError
                ? "Vista previa no disponible"
                : isVideo ? "Sin miniatura de video" : "Sin imagen disponible"}
            </span>
          </div>
        )}

        {/* Play overlay for videos */}
        {isVideo && showThumb && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}

        {/* Format badge */}
        {ad.format && (
          <span className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeColor} text-white capitalize`}>
            {ad.format}
          </span>
        )}

        {/* Status badge */}
        {ad.status && ad.status !== "ACTIVE" && (
          <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-white">
            {ad.status}
          </span>
        )}
      </div>

      {/* Carousel card strip */}
      {isCarousel && (ad.creative?.cards ?? []).length > 0 && (
        <div className="flex gap-1.5 px-2 py-2 bg-gray-50 overflow-x-auto border-t border-gray-100">
          {ad.creative!.cards!.map((card, i) => {
            const cardThumb = card.thumbnail_url || card.image_url
            return (
              <div
                key={i}
                className={`w-14 h-14 rounded-md bg-gray-200 shrink-0 overflow-hidden border border-gray-200 ${cardThumb && onExpand ? "cursor-zoom-in" : ""}`}
                onClick={() => cardThumb && onExpand && onExpand({ url: cardThumb, isVideo: false })}
                title={card.title}
              >
                {cardThumb
                  ? <img src={cardThumb} alt={card.title ?? `Card ${i + 1}`} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-400" /></div>}
              </div>
            )
          })}
        </div>
      )}

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Ad name */}
        <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2" title={ad.name}>
          {ad.name || "Sin nombre"}
        </p>

        {/* Creative copy */}
        {(creativeTitle || creativeBody) && (
          <div className="border-t border-gray-100 pt-2 space-y-1">
            {creativeTitle && (
              <p className="text-xs font-medium text-gray-700 line-clamp-1" title={creativeTitle}>
                {creativeTitle}
              </p>
            )}
            {creativeBody && (
              <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed" title={creativeBody}>
                {creativeBody}
              </p>
            )}
          </div>
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

// ── AdsModal ───────────────────────────────────────────────────────────────────

// Detects Meta API field errors to give a more specific message
function isMetaFieldError(err: string): boolean {
  return err.toLowerCase().includes("nonexisting field") || err.toLowerCase().includes("image_url")
}

function AdsModal({
  campaign,
  ads,
  loading,
  error,
  currency,
  onClose,
  onRetry,
}: {
  campaign: MetaCampaign | null
  ads: MetaAd[]
  loading: boolean
  error: string | null
  currency: string
  onClose: () => void
  onRetry: () => void
}) {
  const [lightbox, setLightbox] = useState<LightboxContent | null>(null)

  // Escape closes lightbox first, then modal
  useEffect(() => {
    if (!campaign) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightbox) setLightbox(null)
        else onClose()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [campaign, lightbox, onClose])

  if (!campaign) return null

  return (
    <>
      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/25 transition"
            onClick={() => setLightbox(null)}
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div
            className="w-[92vw] h-[88vh] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.isVideo ? (
              <video
                src={lightbox.url}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-xl shadow-2xl bg-black"
                style={{ maxWidth: "1280px" }}
              />
            ) : (
              <img
                src={lightbox.url}
                alt="Previsualización"
                className="max-w-full max-h-full rounded-xl object-contain shadow-2xl"
              />
            )}
          </div>

          <p className="absolute bottom-4 text-xs text-white/40">
            {lightbox.isVideo ? "Haz click fuera para cerrar · Esc" : "Haz click fuera para cerrar · Esc"}
          </p>
        </div>
      )}

      {/* ── Modal ── */}
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
            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-gray-100 h-72" />
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 space-y-2">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Error al cargar anuncios</p>
                    <p className="text-xs text-red-600 mt-0.5 font-mono break-words">{error}</p>
                  </div>
                </div>
                {isMetaFieldError(error) && (
                  <div className="ml-8 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 space-y-1">
                    <p className="font-semibold">¿Por qué ocurre esto?</p>
                    <p>
                      La API de Meta no devuelve el campo <code className="bg-amber-100 px-1 rounded">image_url</code> en creatividades
                      de tipo <strong>video</strong>. El backend está solicitando ese campo para todos los tipos de anuncio,
                      lo que causa este error en campañas con videos.
                    </p>
                    <p className="font-semibold mt-1">Cómo resolverlo (en el backend):</p>
                    <p>
                      Al consultar el creative de Meta, solicita <code className="bg-amber-100 px-1 rounded">thumbnail_url</code> en vez
                      de <code className="bg-amber-100 px-1 rounded">image_url</code>, o consulta los dos campos condicionalmente según el tipo de anuncio.
                    </p>
                  </div>
                )}
                <button onClick={onRetry} className="ml-8 text-xs text-red-700 underline">
                  Reintentar
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && ads.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <ImageIcon className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm">Sin anuncios para este período.</p>
              </div>
            )}

            {/* Grid — 2 columns for larger previews */}
            {!loading && !error && ads.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-gray-400">
                    {ads.length} anuncio{ads.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-[11px] text-gray-400">Haz click en una imagen para ampliar</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {ads.map((ad) => (
                    <AdCard
                      key={ad.id || ad.name}
                      ad={ad}
                      currency={currency}
                      onExpand={setLightbox}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── CampaignsTable ─────────────────────────────────────────────────────────────

function CampaignsTable({
  campaigns,
  loading,
  error,
  currency,
  onRetry,
  onViewAds,
}: {
  campaigns: MetaCampaign[]
  loading: boolean
  error: string | null
  currency: string
  onRetry: () => void
  onViewAds?: (c: MetaCampaign) => void
}) {
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("spend")
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc")

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
      ? <ChevronDown className="w-3 h-3 text-blue-600 inline ml-0.5" />
      : <ChevronUp className="w-3 h-3 text-blue-600 inline ml-0.5" />
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
          <button onClick={onRetry} className="mt-2 text-xs text-red-700 underline">
            Reintentar
          </button>
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
      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar campaña..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Table */}
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
                Gasto <SortIcon field="spend" />
              </th>
              <th
                className="text-right px-3 py-2.5 font-medium text-gray-600 cursor-pointer whitespace-nowrap select-none"
                onClick={() => handleSort("impressions")}
              >
                Imp. <SortIcon field="impressions" />
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600 whitespace-nowrap">
                Clics
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600 whitespace-nowrap">
                CTR
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600 whitespace-nowrap">
                CPC
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600 whitespace-nowrap">
                CPM
              </th>
              <th
                className="text-right px-3 py-2.5 font-medium text-gray-600 cursor-pointer whitespace-nowrap select-none"
                onClick={() => handleSort("conversions")}
              >
                Conv. <SortIcon field="conversions" />
              </th>
              <th
                className="text-right px-3 py-2.5 font-medium text-gray-600 cursor-pointer whitespace-nowrap select-none"
                onClick={() => handleSort("roas")}
              >
                ROAS <SortIcon field="roas" />
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600 whitespace-nowrap">
                Ingresos
              </th>
              {onViewAds && (
                <th className="px-3 py-2.5 w-10" />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => {
              const altCount = altPurchaseCount(c.actions)
              const showAltBadge = (toNum(c.conversions) ?? 0) === 0 && altCount > 0
              return (
                <tr key={c.campaign_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-gray-800">
                    <div className="flex items-center gap-1.5">
                      {c.status && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            c.status === "ACTIVE" ? "bg-green-500" : "bg-gray-300"
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
                    <div className="flex items-center justify-end gap-1">
                      <span>{fmt(c.conversions)}</span>
                      {showAltBadge && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 py-0 cursor-help"
                          title={`Meta registra ${altCount} compras alternativas (offsite / pixel). El backend las contabiliza por separado.`}
                        >
                          <Info className="w-2.5 h-2.5" />
                          +{altCount}
                        </span>
                      )}
                    </div>
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
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
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

// ── Sub-componentes ────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent = "blue",
}: {
  label: string
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

// ── Página principal ───────────────────────────────────────────────────────────

export default function MetaPage() {
  const navigate = useNavigate()
  const { selectedClientId, selectedClient } = useClient()
  const { canAct, openPaywall, PaywallModal } = useSubscriptionGate()

  // ── Cuentas publicitarias ──────────────────────────────────────────────────
  const [accounts, setAccounts]           = useState<MetaAdAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [accountsError, setAccountsError] = useState<string | null>(null)
  const [selectedAdAccountId, setSelectedAdAccountId] = useState<string | null>(null)

  // ── Fechas ─────────────────────────────────────────────────────────────────
  const [since, setSince] = useState(defaultSince)
  const [until, setUntil] = useState(defaultUntil)

  // ── Métricas ───────────────────────────────────────────────────────────────
  const [metrics, setMetrics]         = useState<MetaMetrics | null>(null)
  const [currency, setCurrency]       = useState("USD")
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [metricsError, setMetricsError]     = useState<string | null>(null)

  // ── Campañas ────────────────────────────────────────────────────────────────
  const [campaigns, setCampaigns]               = useState<MetaCampaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [campaignsError, setCampaignsError]     = useState<string | null>(null)

  // ── Anuncios (modal) ────────────────────────────────────────────────────────
  const [selectedCampaign, setSelectedCampaign] = useState<MetaCampaign | null>(null)
  const [ads, setAds]                           = useState<MetaAd[]>([])
  const [adsLoading, setAdsLoading]             = useState(false)
  const [adsError, setAdsError]                 = useState<string | null>(null)

  // ── Conectar ───────────────────────────────────────────────────────────────
  const [connecting, setConnecting] = useState(false)

  // ── Cargar cuentas cuando cambia la marca ──────────────────────────────────
  const loadAccounts = useCallback(async (clientId: string) => {
    setAccountsLoading(true)
    setAccountsError(null)
    setAccounts([])
    setSelectedAdAccountId(null)
    setMetrics(null)
    try {
      const list = await getMetaAdAccounts(clientId)
      // Solo cuentas activas
      const active = list.filter((a) => a.is_active !== false)
      setAccounts(active)

      // El identificador para métricas es SIEMPRE platform_account_id
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
        setAccountsError("Error al cargar cuentas de Meta.")
      }
    } finally {
      setAccountsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedClientId) loadAccounts(selectedClientId)
  }, [selectedClientId, loadAccounts])

  // ── Cargar métricas ────────────────────────────────────────────────────────
  const loadMetrics = useCallback(async () => {
    if (!selectedClientId || !selectedAdAccountId) return
    setMetricsLoading(true)
    setMetricsError(null)
    try {
      const res = await getMetaMetrics({
        clientId: selectedClientId,
        adAccountId: selectedAdAccountId,   // platform_account_id
        since,
        until,
      })
      setMetrics(res.metrics)
      // currency viene al nivel raíz de la respuesta
      if (res.currency) setCurrency(res.currency)
      else if (selectedAccount?.currency) setCurrency(selectedAccount.currency)
    } catch (err) {
      if (err instanceof ApiError && err.code === "subscription_required") {
        openPaywall()
      } else if (err instanceof ApiError) {
        setMetricsError(err.serverMessage || err.message)
      } else {
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

  // ── Cargar campañas ────────────────────────────────────────────────────────
  const loadCampaigns = useCallback(async () => {
    if (!selectedClientId || !selectedAdAccountId) return
    setCampaignsLoading(true)
    setCampaignsError(null)
    try {
      const res = await getMetaCampaigns({
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
        } else if (err.status === 400) {
          setCampaignsError("Selecciona una cuenta publicitaria para ver campañas.")
        } else if (err.code === "not_found") {
          setCampaigns([])
        } else {
          setCampaignsError(err.serverMessage || err.message)
        }
      } else {
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

  // ── Cargar anuncios de una campaña ────────────────────────────────────────
  const loadAds = useCallback(async (campaign: MetaCampaign) => {
    if (!selectedClientId) return
    setAdsLoading(true)
    setAdsError(null)
    setAds([])
    try {
      const res = await getMetaAds({
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

  const handleViewAds = (campaign: MetaCampaign) => {
    setSelectedCampaign(campaign)
    loadAds(campaign)
  }

  const handleCloseAds = () => {
    setSelectedCampaign(null)
    setAds([])
    setAdsError(null)
  }

  // ── Cambiar cuenta publicitaria (id = platform_account_id) ────────────────
  const handleSelectAccount = (platformAccountId: string) => {
    setSelectedAdAccountId(platformAccountId)
    if (selectedClientId) localStorage.setItem(adAccountKey(selectedClientId), platformAccountId)
  }

  // ── Conectar Meta ──────────────────────────────────────────────────────────
  const handleConnect = async () => {
    if (!selectedClientId) { navigate("/brands"); return }
    if (!canAct) { openPaywall(); return }
    setConnecting(true)
    try {
      const redirectUri = `${window.location.origin}/settings?tab=integrations`
      const { url } = await getMetaConnectLink(selectedClientId, redirectUri)
      window.location.href = url
    } catch (err) {
      if (err instanceof ApiError && err.code === "subscription_required") {
        openPaywall()
      }
      setConnecting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  // 1. Sin marca seleccionada
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
            Selecciona o crea una marca para ver las métricas de Meta Ads asociadas.
          </p>
          <Link to="/brands">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Ir a Marcas
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // selectedAdAccountId almacena platform_account_id
  const selectedAccount = accounts.find(
    (a) => a.platform_account_id === selectedAdAccountId
  )

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
            <h1 className="text-2xl font-bold text-gray-900">Meta Ads</h1>
            <p className="text-sm text-gray-500">
              Marca:{" "}
              <span className="font-medium text-gray-700">{selectedClient?.name}</span>
            </p>
          </div>
        </div>

        {/* Controles: selector cuenta + fechas + refresh */}
        {accounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de cuenta (solo si >1) — valor = platform_account_id */}
            {accounts.length > 1 && (
              <select
                value={selectedAdAccountId ?? ""}
                onChange={(e) => handleSelectAccount(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="" disabled>Cuenta publicitaria</option>
                {accounts.map((a) => (
                  <option key={a.platform_account_id} value={a.platform_account_id}>
                    {a.account_name}
                  </option>
                ))}
              </select>
            )}

            {/* Rango de fechas */}
            <div className="flex items-center gap-1.5 text-sm">
              <input
                type="date"
                value={since}
                max={until}
                onChange={(e) => setSince(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={until}
                min={since}
                max={toISODate(new Date())}
                onChange={(e) => setUntil(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Botón aplicar / refresh */}
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

      {/* Estado: cargando cuentas */}
      {accountsLoading && (
        <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando cuentas de Meta...</span>
        </div>
      )}

      {/* Estado: error cuentas */}
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

      {/* Estado: sin cuentas conectadas */}
      {!accountsLoading && !accountsError && accounts.length === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Conecta tu cuenta de Meta Ads
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  No hay cuentas publicitarias conectadas para{" "}
                  <strong>{selectedClient?.name}</strong>. Completa el proceso OAuth para
                  importar tus campañas y ver métricas reales.
                </p>
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  {connecting ? "Redirigiendo..." : "Conectar Meta Ads"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cuentas cargadas — mostrar badge de cuenta seleccionada */}
      {!accountsLoading && accounts.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            {selectedAccount ? (
              <span>
                <strong>{selectedAccount.account_name}</strong>
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

      {/* Sin cuenta seleccionada (múltiples disponibles) */}
      {!accountsLoading && accounts.length > 1 && !selectedAdAccountId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Selecciona una cuenta publicitaria en el selector de arriba para ver métricas.
        </div>
      )}

      {/* Métricas */}
      {selectedAdAccountId && (
        <>
          {/* Cargando métricas */}
          {metricsLoading && <SectionSkeleton />}

          {/* Error métricas */}
          {metricsError && !metricsLoading && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error al cargar métricas</p>
                <p className="text-xs text-red-600 mt-0.5">{metricsError}</p>
                <button
                  onClick={loadMetrics}
                  className="mt-2 text-xs text-red-700 underline"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* KPIs */}
          {!metricsLoading && !metricsError && metrics && (
            <>
              {/* Fila 1: métricas de gasto y alcance */}
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Rendimiento del período
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard
                    label="Gasto"
                    value={fmtCurrency(metrics.spend, currency)}
                    icon={<DollarSign className="w-4 h-4" />}
                    accent="green"
                  />
                  <KpiCard
                    label="Impresiones"
                    value={fmt(metrics.impressions)}
                    icon={<Eye className="w-4 h-4" />}
                    accent="blue"
                  />
                  <KpiCard
                    label="Clics"
                    value={fmt(metrics.clicks)}
                    sub={metrics.ctr != null ? `CTR ${fmtPct(metrics.ctr)}` : undefined}
                    icon={<MousePointerClick className="w-4 h-4" />}
                    accent="purple"
                  />
                  <KpiCard
                    label="Alcance"
                    value={fmt(metrics.reach)}
                    icon={<Users className="w-4 h-4" />}
                    accent="orange"
                  />
                </div>
              </div>

              {/* Fila 2: métricas de eficiencia */}
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Eficiencia
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard
                    label="CPC"
                    value={fmtCurrency(metrics.cpc, currency)}
                    sub="Coste por clic"
                    icon={<MousePointerClick className="w-4 h-4" />}
                    accent="blue"
                  />
                  <KpiCard
                    label="CPM"
                    value={fmtCurrency(metrics.cpm, currency)}
                    sub="Coste por mil imp."
                    icon={<DollarSign className="w-4 h-4" />}
                    accent="purple"
                  />
                  <KpiCard
                    label="CTR"
                    value={fmtPct(metrics.ctr)}
                    sub="Click-through rate"
                    icon={<Percent className="w-4 h-4" />}
                    accent="orange"
                  />
                  <KpiCard
                    label="ROAS"
                    value={fmtMultiplier(metrics.roas)}
                    sub={
                      metrics.revenue != null
                        ? `Ingresos: ${fmtCurrency(metrics.revenue, currency)}`
                        : undefined
                    }
                    icon={<TrendingUp className="w-4 h-4" />}
                    accent="green"
                  />
                </div>
              </div>

              {/* Fila 3: conversiones (si hay datos) */}
              {(metrics.conversions != null || metrics.revenue != null || metrics.cpa != null) && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Conversiones
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {metrics.conversions != null && (
                      <KpiCard
                        label="Conversiones"
                        value={fmt(metrics.conversions as number)}
                        icon={<TrendingUp className="w-4 h-4" />}
                        accent="green"
                      />
                    )}
                    {metrics.revenue != null && (
                      <KpiCard
                        label="Ingresos"
                        value={fmtCurrency(metrics.revenue as number, currency)}
                        icon={<DollarSign className="w-4 h-4" />}
                        accent="blue"
                      />
                    )}
                    {metrics.cpa != null && (
                      <KpiCard
                        label="CPA"
                        value={fmtCurrency(metrics.cpa as number, currency)}
                        sub="Coste por conversión"
                        icon={<DollarSign className="w-4 h-4" />}
                        accent="orange"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Tabla de campos adicionales que devuelva el backend */}
              {(() => {
                const known = new Set([
                  "spend","impressions","clicks","reach","ctr","cpc","cpm",
                  "conversions","revenue","roas","cpa","frequency",
                  "actions","action_values",
                ])
                const extra = Object.entries(metrics).filter(
                  ([k, v]) => !known.has(k) && typeof v === "number"
                )
                if (extra.length === 0) return null
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-700">
                        Datos adicionales
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {extra.map(([key, val]) => (
                          <div key={key}>
                            <p className="text-xs text-gray-500 capitalize">
                              {key.replace(/_/g, " ")}
                            </p>
                            <p className="text-base font-semibold text-gray-900">
                              {typeof val === "number" ? fmt(val, 2) : String(val)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}
            </>
          )}

          {/* Sin métricas (respuesta vacía / período sin datos) */}
          {!metricsLoading && !metricsError && !metrics && (
            <div className="text-center py-12 text-gray-400 text-sm">
              Sin datos para el período seleccionado.
            </div>
          )}

          {/* ── Campañas ───────────────────────────────────────────────── */}
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
              onViewAds={handleViewAds}
            />
          </div>
        </>
      )}
    </div>
  )
}
