import React, { useEffect, useState, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { getProfile } from "@/infrastructure/api/profileRepository"
import {
  getConsolidatedDashboard,
  syncDashboard,
  type ConsolidatedDashboardResult,
  type ConsolidatedCampaign,
  type ConsolidatedPlatform,
} from "@/infrastructure/api/dashboardRepository"
import { useDashboardPlatformSummary } from "@/interface/hooks/usePlatforms"
import { StatusFilter, matchesStatusFilter, type StatusFilterValue } from "@/interface/components/StatusFilter"
import { MetricTooltip } from "@/interface/components/MetricTooltip"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, TrendingUp, AlertCircle, ArrowUpRight, ChevronDown, ChevronRight } from "lucide-react"
import { SubscriptionBanner } from "@/components/SubscriptionBanner"
import { useClient } from "@/app/providers/ClientProvider"
import InlineAdSets from "@/interface/components/platforms/shared/InlineAdSets"
import type { PlatformSummary } from "@/infrastructure/api/platformRepository"

const HIERARCHY_PLATFORMS = new Set(["meta", "google_ads"])

// ── Types ─────────────────────────────────────────────────────────────────────

type DatePreset = "7d" | "30d" | "90d"

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: "7 días", value: "7d" },
  { label: "30 días", value: "30d" },
  { label: "90 días", value: "90d" },
]

function getDateRange(preset: DatePreset): { since: string; until: string } {
  const until = new Date()
  const since = new Date()
  since.setDate(since.getDate() - (preset === "7d" ? 7 : preset === "30d" ? 30 : 90))
  const fmt = (d: Date) => d.toISOString().split("T")[0]
  return { since: fmt(since), until: fmt(until) }
}

type PlatformTab = "all" | "meta" | "google_ads" | "linkedin" | "tiktok"

const PLATFORM_LABELS: Record<string, string> = {
  all: "Todas",
  meta: "Meta",
  google_ads: "Google Ads",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
}

const PLATFORM_COLORS: Record<string, string> = {
  meta: "bg-blue-500",
  google_ads: "bg-red-500",
  linkedin: "bg-blue-700",
  tiktok: "bg-gray-900",
}

const PLATFORM_URL: Record<string, string> = {
  meta: "meta",
  google_ads: "google-ads",
  linkedin: "linkedin",
  tiktok: "tiktok",
}

// ── Format helpers ─────────────────────────────────────────────────────────────

function formatMoney(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function timeAgo(isoString: string | null): string {
  if (!isoString) return "Nunca"
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "Hace un momento"
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `Hace ${days} día${days > 1 ? "s" : ""}`
}

// ── Status dot ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status?: string }) {
  const s = (status ?? "unknown").toLowerCase()
  const color =
    s === "active"  ? "bg-green-500"
    : s === "paused"  ? "bg-gray-400"
    : s === "removed" ? "bg-red-400"
    : "bg-gray-300"
  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`} title={status} />
}

// ── Stat bar ──────────────────────────────────────────────────────────────────

interface ActiveMetrics {
  campaigns: number
  spend: number
  ctr: number
  roa: number | null
  impressions: number
  clicks: number
}

function StatBar({ metrics }: { metrics: ActiveMetrics }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
          <div className="p-5">
            <p className="text-xs text-gray-400 mb-2">
              <MetricTooltip metric="campaigns">Campañas</MetricTooltip>
            </p>
            <p className="text-xl font-bold text-blue-600">{metrics.campaigns}</p>
            <p className="text-xs text-gray-400 mt-1">{formatNumber(metrics.impressions)} impresiones</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-400 mb-2">
              <MetricTooltip metric="spend">Gasto Total</MetricTooltip>
            </p>
            <p className="text-xl font-bold text-green-600">{formatMoney(metrics.spend)}</p>
            <p className="text-xs text-gray-400 mt-1">{formatNumber(metrics.clicks)} clics</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-400 mb-2">
              <MetricTooltip metric="roa">ROA</MetricTooltip>
            </p>
            <p className="text-xl font-bold text-green-600">
              {metrics.roa !== null ? `${metrics.roa.toFixed(2)}x` : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Retorno sobre inversión</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-400 mb-2">
              <MetricTooltip metric="ctr">CTR Promedio</MetricTooltip>
            </p>
            <p className="text-xl font-bold text-purple-600">{metrics.ctr.toFixed(2)}%</p>
            <p className="text-xs text-gray-400 mt-1">Tasa de clics</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatBarSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-5 space-y-2">
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-2.5 w-14 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Platform filter strip ─────────────────────────────────────────────────────

function AllPill({ isActive, count, onClick }: { isActive: boolean; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
        isActive
          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      Todas
      {count !== undefined && (
        <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
          isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}

interface PlatformPillProps {
  platform: PlatformSummary
  consolidatedData?: ConsolidatedPlatform
  isActive: boolean
  onClick: () => void
}

function PlatformPill({ platform, consolidatedData, isActive, onClick }: PlatformPillProps) {
  const navigate = useNavigate()
  const dotColor = PLATFORM_COLORS[platform.platform] ?? "bg-gray-400"
  const campaignCount = consolidatedData
    ? consolidatedData.campaigns.length
    : platform.total_campaigns

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-2.5 px-4 py-2 rounded-xl border cursor-pointer transition-all ${
        isActive
          ? "bg-blue-50 border-blue-200 shadow-sm"
          : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
      <span className={`text-sm font-medium ${isActive ? "text-blue-700" : "text-gray-700"}`}>
        {PLATFORM_LABELS[platform.platform] ?? platform.platform}
      </span>
      <span className={`text-xs ${isActive ? "text-blue-400" : "text-gray-400"}`}>
        {campaignCount}
      </span>
      <span className={`w-1.5 h-1.5 rounded-full ${platform.is_connected ? "bg-green-400" : "bg-gray-300"}`} />
      {platform.is_connected && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/platforms/${PLATFORM_URL[platform.platform] ?? platform.platform}`)
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
          title={`Ver ${PLATFORM_LABELS[platform.platform]}`}
        >
          <ArrowUpRight className={`w-3.5 h-3.5 ${isActive ? "text-blue-400" : "text-gray-400"}`} />
        </button>
      )}
    </div>
  )
}

// ── Campaign table row ─────────────────────────────────────────────────────────

function CampaignRow({ c }: { c: ConsolidatedCampaign }) {
  const navigate = useNavigate()
  const { selectedClientId } = useClient()
  const [expanded, setExpanded] = useState(false)
  const supportsExpand = HIERARCHY_PLATFORMS.has(c.platform)

  return (
    <React.Fragment>
      <tr className="border-b hover:bg-gray-50/50 transition-colors">
        <td className="py-3 pl-3 pr-1 w-8">
          {supportsExpand && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-0.5 text-gray-400 hover:text-blue-600 rounded transition"
              title={expanded ? "Colapsar" : "Ver ad sets"}
            >
              {expanded
                ? <ChevronDown className="w-4 h-4" />
                : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </td>
        <td className="py-3 px-4 text-sm text-gray-800 font-medium">
          <div className="flex items-center gap-2 min-w-0">
            <StatusDot status={c.status} />
            <button
              onClick={() => navigate(`/campaigns/${c.campaign_id}`)}
              className="truncate max-w-[200px] text-left hover:underline hover:text-blue-700 transition-colors cursor-pointer"
              title={c.name}
            >
              {c.name}
            </button>
          </div>
        </td>
        <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
          {PLATFORM_LABELS[c.platform] ?? c.platform}
        </td>
        <td className="py-3 px-4 text-sm text-right font-medium text-green-700">
          {formatMoney(c.spend)}
        </td>
        <td className="py-3 px-4 text-sm text-right text-gray-600">{formatNumber(c.impressions)}</td>
        <td className="py-3 px-4 text-sm text-right text-gray-600">{formatNumber(c.clicks)}</td>
        <td className="py-3 px-4 text-sm text-right text-purple-600">{c.ctr.toFixed(2)}%</td>
        <td className="py-3 px-4 text-sm text-right text-blue-700">
          {c.roa !== null ? `${c.roa.toFixed(2)}x` : "—"}
        </td>
      </tr>
      {supportsExpand && expanded && (
        <InlineAdSets
          campaignId={c.campaign_id}
          clientId={selectedClientId ?? undefined}
          platform={c.platform as "meta" | "google_ads"}
          colSpan={8}
        />
      )}
    </React.Fragment>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { selectedClientId } = useClient()

  const [name, setName] = useState<string>("")
  const [consolidated, setConsolidated] = useState<ConsolidatedDashboardResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const { data: platformsSummary, loading: platformsLoading } = useDashboardPlatformSummary(selectedClientId)

  const [activePlatformTab, setActivePlatformTab] = useState<PlatformTab>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [datePreset, setDatePreset] = useState<DatePreset>("30d")

  useEffect(() => {
    if (!selectedClientId) return
    setLoading(true)
    setConsolidated(null)

    Promise.all([
      getProfile(),
      getConsolidatedDashboard(selectedClientId, undefined, getDateRange(datePreset)),
    ])
      .then(([profile, data]) => {
        setName(profile.name)
        setConsolidated(data)
      })
      .catch((err) => console.error("Error al cargar dashboard:", err))
      .finally(() => setLoading(false))
  }, [selectedClientId, datePreset])

  const handleSync = useCallback(async () => {
    if (!selectedClientId || syncing) return
    setSyncing(true)
    setSyncError(null)
    try {
      const fresh = await syncDashboard(selectedClientId, getDateRange(datePreset))
      setConsolidated(fresh)
    } catch (err: any) {
      console.error("Error al sincronizar:", err)
      setSyncError(err?.response?.data?.error ?? err?.message ?? "Error al sincronizar")
    } finally {
      setSyncing(false)
    }
  }, [selectedClientId, syncing, datePreset])

  const activePlatformData: ConsolidatedPlatform | null = useMemo(() => {
    if (activePlatformTab === "all" || !consolidated) return null
    return consolidated.platforms.find((p) => p.platform === activePlatformTab) ?? null
  }, [activePlatformTab, consolidated])

  const activeMetrics = useMemo((): ActiveMetrics | null => {
    if (!consolidated) return null
    if (activePlatformTab === "all") {
      const t = consolidated.totals
      return {
        campaigns: consolidated.campaigns.length,
        spend: t.spend,
        ctr: t.ctr,
        roa: t.roa,
        impressions: t.impressions,
        clicks: t.clicks,
      }
    }
    return {
      campaigns: activePlatformData?.campaigns.length ?? 0,
      spend: activePlatformData?.spend ?? 0,
      ctr: activePlatformData?.ctr ?? 0,
      roa: activePlatformData?.roa ?? null,
      impressions: activePlatformData?.impressions ?? 0,
      clicks: activePlatformData?.clicks ?? 0,
    }
  }, [activePlatformTab, consolidated, activePlatformData])

  const activeCampaigns = useMemo((): ConsolidatedCampaign[] => {
    if (!consolidated) return []
    const base = activePlatformTab === "all"
      ? consolidated.campaigns
      : (activePlatformData?.campaigns ?? [])
    return base.filter((c) => matchesStatusFilter(c.status, statusFilter))
  }, [activePlatformTab, consolidated, activePlatformData, statusFilter])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-6 space-y-5">
        <SubscriptionBanner />

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-gray-600">
            {name ? `Hola, ${name.split(" ")[0]}` : "Resumen consolidado"}
            <span className="text-gray-400"> · Plataformas publicitarias</span>
          </p>
          <div className="flex items-center gap-2">
            {/* Date preset pills */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {DATE_PRESETS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setDatePreset(value)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    datePreset === value
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {consolidated?.last_synced_at && (
              <span className="text-xs text-gray-400 hidden sm:block">
                {timeAgo(consolidated.last_synced_at)}
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={syncing || !selectedClientId}
              className="gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Actualizando…" : "Actualizar"}
            </Button>
          </div>
        </div>

        {/* ── Sync error ──────────────────────────────────────────── */}
        {syncError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{syncError}</span>
            <button onClick={() => setSyncError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ── Loading ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-4">
            <StatBarSkeleton />
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
            <Card>
              <CardContent className="p-4">
                <div className="h-48 bg-gray-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>

        ) : consolidated?.needs_sync ? (
          /* ── Never-synced empty state ──────────────────────────── */
          <Card className="max-w-xl mx-auto mt-8">
            <CardContent className="flex flex-col items-center text-center py-12 gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Sin datos aún</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Conecta tus plataformas publicitarias y sincroniza para ver el consolidado de tus campañas.
                </p>
              </div>
              <Button
                onClick={handleSync}
                disabled={syncing || !selectedClientId}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Sincronizando…" : "Sincronizar ahora"}
              </Button>
            </CardContent>
          </Card>

        ) : (
          <>
            {/* Stat bar */}
            {activeMetrics !== null && <StatBar metrics={activeMetrics} />}

            {/* Platform filter strip — fuses tab + platform card */}
            <div className="flex flex-wrap gap-2">
              <AllPill
                isActive={activePlatformTab === "all"}
                count={consolidated?.campaigns.length}
                onClick={() => setActivePlatformTab("all")}
              />
              {!platformsLoading && platformsSummary?.platforms.map((p) => (
                <PlatformPill
                  key={p.platform}
                  platform={p}
                  consolidatedData={consolidated?.platforms.find((cp) => cp.platform === p.platform)}
                  isActive={activePlatformTab === p.platform}
                  onClick={() => setActivePlatformTab(p.platform as PlatformTab)}
                />
              ))}
            </div>

            {/* Campaigns table — full width */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base font-semibold text-gray-800">
                    Campañas
                    {activePlatformTab !== "all" && (
                      <span className="ml-1.5 text-gray-400 font-normal text-sm">
                        · {PLATFORM_LABELS[activePlatformTab]}
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <StatusFilter value={statusFilter} onChange={setStatusFilter} />
                    <span className="text-xs text-gray-400">{activeCampaigns.length} campañas</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {activeCampaigns.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50/60">
                          <th className="py-2.5 w-8" />
                          <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500">Campaña</th>
                          <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500">Plataforma</th>
                          <th className="py-2.5 px-4 text-right text-xs font-medium text-gray-500">
                            <MetricTooltip metric="spend">Gasto</MetricTooltip>
                          </th>
                          <th className="py-2.5 px-4 text-right text-xs font-medium text-gray-500">
                            <MetricTooltip metric="imp">Impr.</MetricTooltip>
                          </th>
                          <th className="py-2.5 px-4 text-right text-xs font-medium text-gray-500">
                            <MetricTooltip metric="clicks">Clics</MetricTooltip>
                          </th>
                          <th className="py-2.5 px-4 text-right text-xs font-medium text-gray-500">
                            <MetricTooltip metric="ctr">CTR</MetricTooltip>
                          </th>
                          <th className="py-2.5 px-4 text-right text-xs font-medium text-gray-500">
                            <MetricTooltip metric="roa">ROA</MetricTooltip>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeCampaigns.map((c) => (
                          <CampaignRow key={`${c.platform}-${c.campaign_id}`} c={c} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <TrendingUp className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">
                      {statusFilter !== "all"
                        ? `Sin campañas ${statusFilter === "active" ? "activas" : "pausadas"}`
                        : activePlatformTab === "all"
                        ? "Sin campañas sincronizadas"
                        : `Sin campañas en ${PLATFORM_LABELS[activePlatformTab]}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {statusFilter !== "all"
                        ? "Cambia el filtro de estado para ver otras campañas"
                        : "Presiona \"Actualizar\" para sincronizar desde tus plataformas"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
