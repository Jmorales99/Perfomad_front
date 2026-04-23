import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useClient } from "@/app/providers/ClientProvider"
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react"
import { MetricTooltip } from "@/interface/components/MetricTooltip"
import { StatusFilter, matchesStatusFilter, type StatusFilterValue } from "@/interface/components/StatusFilter"
import { fmt, fmtCurrency, fmtMultiplier, fmtPct, toNum } from "./formatters"
import InlineAdSets from "./InlineAdSets"

export interface NormalizedCampaignRow {
  campaign_id: string
  campaign_name: string
  status?: string | null
  spend?: number | null
  impressions?: number | null
  clicks?: number | null
  ctr?: number | null
  cpc?: number | null
  cpm?: number | null
  conversions?: number | null
  roas?: number | null
  revenue?: number | null
}

type SortField = "spend" | "roas" | "impressions" | "conversions"

interface Props {
  campaigns: NormalizedCampaignRow[]
  loading: boolean
  error: string | null
  currency: string
  onRetry: () => void
  onReconnect?: () => void
  /**
   * When provided, each row shows an "Optimize with AI" action that imports
   * the platform campaign into our DB and navigates to /optimize/:uuid.
   * Returns a promise so the button can show a spinner while importing.
   */
  onOptimize?: (c: NormalizedCampaignRow) => Promise<void> | void
  supportsAdsHierarchy?: boolean
  platformKey?: "meta" | "google_ads" | "linkedin" | "tiktok"
  since?: string
  until?: string
}

export default function GenericCampaignsTable({
  campaigns,
  loading,
  error,
  currency,
  onRetry,
  onReconnect,
  onOptimize,
  supportsAdsHierarchy,
  platformKey,
  since,
  until,
}: Props) {
  const navigate = useNavigate()
  const { selectedClientId } = useClient()
  const [optimizingId, setOptimizingId] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const handleOptimizeClick = async (c: NormalizedCampaignRow) => {
    if (!onOptimize) return
    setOptimizingId(c.campaign_id)
    try {
      await onOptimize(c)
    } finally {
      setOptimizingId(null)
    }
  }

  const toggleRow = (id: string) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))

  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("spend")
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const filtered = campaigns
    .filter((c) => (c.campaign_name ?? "").toLowerCase().includes(search.toLowerCase()))
    .filter((c) => matchesStatusFilter(c.status ?? "", statusFilter))
    .sort((a, b) => {
      const av = toNum((a as any)[sortField === "roas" ? "roas" : sortField]) ?? -1
      const bv = toNum((b as any)[sortField === "roas" ? "roas" : sortField]) ?? -1
      return sortDir === "desc" ? bv - av : av - bv
    })

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField !== field ? (
      <ChevronDown className="w-3 h-3 opacity-30 inline ml-0.5" />
    ) : sortDir === "desc" ? (
      <ChevronDown className="w-3 h-3 text-blue-600 inline ml-0.5" />
    ) : (
      <ChevronUp className="w-3 h-3 text-blue-600 inline ml-0.5" />
    )

  // colSpan for the InlineAdSets row:
  // 1 (chevron, if supportsAdsHierarchy) + 1 (name) + 9 (metrics) + 1 (actions, if onOptimize)
  const colSpan = (supportsAdsHierarchy ? 1 : 0) + 1 + 9 + (onOptimize ? 1 : 0)

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
              Reconectar plataforma
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
      <div className="flex items-center gap-2 flex-wrap">
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
        <StatusFilter value={statusFilter} onChange={setStatusFilter} accentColor="blue" />
        <span className="text-xs text-gray-400">{filtered.length} campañas</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {supportsAdsHierarchy && <th className="w-8 px-2 py-2.5" />}
              <th className="text-left px-3 py-2.5 font-medium text-gray-600 min-w-[180px]">Campaña</th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600 cursor-pointer whitespace-nowrap select-none" onClick={() => handleSort("spend")}>
                <MetricTooltip metric="spend">Gasto</MetricTooltip> <SortIcon field="spend" />
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600 cursor-pointer whitespace-nowrap select-none" onClick={() => handleSort("impressions")}>
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
              <th className="text-right px-3 py-2.5 font-medium text-gray-600 cursor-pointer whitespace-nowrap select-none" onClick={() => handleSort("conversions")}>
                <MetricTooltip metric="conversions">Conv.</MetricTooltip> <SortIcon field="conversions" />
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600 cursor-pointer whitespace-nowrap select-none" onClick={() => handleSort("roas")}>
                <MetricTooltip metric="roas">ROAS</MetricTooltip> <SortIcon field="roas" />
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600 whitespace-nowrap">
                <MetricTooltip metric="revenue">Ingresos</MetricTooltip>
              </th>
              {onOptimize && <th className="px-3 py-2.5 w-12" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <React.Fragment key={c.campaign_id}>
                <tr className={`hover:bg-gray-50 transition-colors ${expandedRows[c.campaign_id] ? "bg-blue-50/20" : ""}`}>
                  {supportsAdsHierarchy && (
                    <td className="pl-2 pr-1 py-2.5 w-8">
                      <button
                        onClick={() => toggleRow(c.campaign_id)}
                        className="p-0.5 rounded text-gray-400 hover:text-blue-600 transition"
                        title={expandedRows[c.campaign_id] ? "Colapsar" : "Ver ad sets"}
                      >
                        {expandedRows[c.campaign_id]
                          ? <ChevronDown className="w-4 h-4" />
                          : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                  )}
                  <td className="px-3 py-2.5 font-medium text-gray-800">
                    <div className="flex items-center gap-1.5">
                      {c.status && (() => {
                        const s = c.status.toLowerCase()
                        const isActive = s === "active" || s === "enabled" || s === "eligible"
                        const isPaused = s === "paused"
                        const isIssues =
                          s === "issues" || s === "with_issues" || s === "pending_review"
                          || s === "pending_billing_info" || s === "disapproved"
                          || s === "misconfigured" || s === "not_eligible"
                          || s === "limited" || s === "pending"
                        const color = isActive
                          ? "bg-green-500"
                          : isIssues
                            ? "bg-amber-500"
                            : isPaused
                              ? "bg-gray-400"
                              : "bg-gray-300"
                        const title = isIssues
                          ? "Requiere acción — revisa en la plataforma"
                          : isActive
                            ? "Activa"
                            : isPaused
                              ? "Pausada"
                              : "Estado desconocido"
                        return (
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`}
                            title={title}
                            aria-label={title}
                          />
                        )
                      })()}
                      <button
                        onClick={() =>
                          platformKey
                            ? navigate(`/platforms/${platformKey}/campaigns/${c.campaign_id}`, {
                                state: { campaignRow: c, clientId: selectedClientId },
                              })
                            : navigate(`/campaigns/${c.campaign_id}`)
                        }
                        className="truncate max-w-[200px] text-left hover:underline hover:text-blue-700 transition-colors cursor-pointer"
                        title={c.campaign_name}
                      >
                        {c.campaign_name}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{fmtCurrency(c.spend, currency)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{fmt(c.impressions)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{fmt(c.clicks)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{fmtPct(c.ctr)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{fmtCurrency(c.cpc, currency)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{fmtCurrency(c.cpm, currency)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{fmt(c.conversions)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{fmtMultiplier(c.roas)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                    {(toNum(c.revenue) ?? 0) > 0 ? fmtCurrency(c.revenue, currency) : "—"}
                  </td>
                  {onOptimize && (
                    <td className="px-2 py-2.5">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleOptimizeClick(c)}
                          disabled={optimizingId === c.campaign_id}
                          title="Optimizar con IA"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition disabled:opacity-50 disabled:cursor-wait"
                        >
                          {optimizingId === c.campaign_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>

                {supportsAdsHierarchy && expandedRows[c.campaign_id] && (
                  <InlineAdSets
                    campaignId={c.campaign_id}
                    clientId={selectedClientId ?? undefined}
                    platform={platformKey}
                    since={since}
                    until={until}
                    colSpan={colSpan}
                  />
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
