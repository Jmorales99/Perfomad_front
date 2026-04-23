import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useClient } from "@/app/providers/ClientProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, BarChart3, Loader2, RefreshCw, Search } from "lucide-react"
import { ApiError } from "@/infrastructure/api/errors"
import PlatformHeader from "@/interface/components/platforms/shared/PlatformHeader"
import DateRangePicker from "@/interface/components/platforms/shared/DateRangePicker"
import {
  defaultSince,
  defaultUntil,
  fmt,
  fmtCurrency,
  fmtMultiplier,
  fmtPct,
  toNum,
} from "@/interface/components/platforms/shared/formatters"
import {
  PLATFORM_ADAPTERS,
  platformUrlSlug,
  type PlatformAdapter,
  type PlatformKey,
} from "@/interface/components/platforms/shared/platformConfig"
import type { NormalizedMetrics } from "@/interface/components/platforms/shared/PlatformKpis"

interface PlatformRow {
  key: PlatformKey
  title: string
  brandName?: string
  currency: string
  status: "loading" | "ok" | "not_connected" | "error"
  accountName?: string
  metrics: NormalizedMetrics | null
  error?: string
}

const COMPARE_PLATFORMS: PlatformKey[] = ["meta", "google_ads", "tiktok", "linkedin"]

function sumNullable(a: number | null | undefined, b: number | null | undefined): number | null {
  const an = toNum(a)
  const bn = toNum(b)
  if (an == null && bn == null) return null
  return (an ?? 0) + (bn ?? 0)
}

function safeDiv(n: number | null, d: number | null): number | null {
  if (n == null || d == null || d === 0) return null
  return n / d
}

export default function PlatformComparePage() {
  const navigate = useNavigate()
  const { selectedClientId, selectedClient } = useClient()
  const dS = defaultSince()
  const dU = defaultUntil()
  const [appliedSince, setAppliedSince] = useState(dS)
  const [appliedUntil, setAppliedUntil] = useState(dU)
  const [draftSince, setDraftSince] = useState(dS)
  const [draftUntil, setDraftUntil] = useState(dU)
  const [rows, setRows] = useState<PlatformRow[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadPlatform = useCallback(
    async (adapter: PlatformAdapter): Promise<PlatformRow> => {
      if (!selectedClientId) {
        return {
          key: adapter.key,
          title: adapter.title,
          brandName: adapter.brandName,
          currency: "USD",
          status: "not_connected",
          metrics: null,
        }
      }
      try {
        const accs = await adapter.listAccounts(selectedClientId)
        const active = accs.filter((a) => a.is_active)
        if (active.length === 0) {
          return {
            key: adapter.key,
            title: adapter.title,
            brandName: adapter.brandName,
            currency: "USD",
            status: "not_connected",
            metrics: null,
          }
        }
        // Use first active account for comparison (MVP)
        const acc = active[0]
        const res = await adapter.getMetrics({
          clientId: selectedClientId,
          adAccountId: acc.platform_account_id,
          since: appliedSince,
          until: appliedUntil,
        })
        return {
          key: adapter.key,
          title: adapter.title,
          brandName: adapter.brandName,
          currency: res.currency || acc.currency || "USD",
          status: "ok",
          accountName: res.accountName ?? acc.account_name ?? undefined,
          metrics: res.metrics,
        }
      } catch (e) {
        return {
          key: adapter.key,
          title: adapter.title,
          brandName: adapter.brandName,
          currency: "USD",
          status: "error",
          metrics: null,
          error: e instanceof ApiError ? e.message : "No pudimos cargar métricas.",
        }
      }
    },
    [selectedClientId, appliedSince, appliedUntil]
  )

  const loadAll = useCallback(async () => {
    setRows(
      COMPARE_PLATFORMS.map((k) => ({
        key: k,
        title: PLATFORM_ADAPTERS[k].title,
        brandName: PLATFORM_ADAPTERS[k].brandName,
        currency: "USD",
        status: "loading" as const,
        metrics: null,
      }))
    )
    const results = await Promise.all(
      COMPARE_PLATFORMS.map((k) => loadPlatform(PLATFORM_ADAPTERS[k]))
    )
    setRows(results)
  }, [loadPlatform])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const dateRangeValid = draftSince <= draftUntil
  const searchUnchanged =
    draftSince === appliedSince && draftUntil === appliedUntil

  const handleApplyDateRange = () => {
    if (!dateRangeValid) return
    setAppliedSince(draftSince)
    setAppliedUntil(draftUntil)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setDraftSince(appliedSince)
    setDraftUntil(appliedUntil)
    await loadAll()
    setRefreshing(false)
  }

  // Aggregate totals across platforms (only those with metrics)
  const totals = useMemo(() => {
    const ok = rows.filter((r) => r.status === "ok" && r.metrics)
    if (ok.length === 0) return null
    const acc: NormalizedMetrics = {
      spend: null,
      impressions: null,
      clicks: null,
      reach: null,
      conversions: null,
      revenue: null,
      ctr: null,
      cpc: null,
      cpm: null,
      cpa: null,
      roas: null,
    }
    for (const r of ok) {
      const m = r.metrics!
      acc.spend = sumNullable(acc.spend, m.spend)
      acc.impressions = sumNullable(acc.impressions, m.impressions)
      acc.clicks = sumNullable(acc.clicks, m.clicks)
      acc.reach = sumNullable(acc.reach, m.reach)
      acc.conversions = sumNullable(acc.conversions, m.conversions)
      acc.revenue = sumNullable(acc.revenue, m.revenue)
    }
    acc.ctr =
      acc.impressions != null && acc.clicks != null && acc.impressions > 0
        ? (acc.clicks / acc.impressions) * 100
        : null
    acc.cpc = safeDiv(acc.spend, acc.clicks)
    acc.cpm =
      acc.impressions != null && acc.impressions > 0
        ? safeDiv(acc.spend != null ? acc.spend * 1000 : null, acc.impressions)
        : null
    acc.cpa = safeDiv(acc.spend, acc.conversions)
    acc.roas = safeDiv(acc.revenue, acc.spend)
    return acc
  }, [rows])

  if (!selectedClientId) {
    return (
      <div className="p-6">
        <PlatformHeader title="Comparador de plataformas" />
        <Card className="mt-6">
          <CardContent className="py-10 text-center text-gray-500">
            Selecciona una marca para comparar su rendimiento cross-plataforma.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PlatformHeader
        title="Comparador de plataformas"
        brandName={selectedClient?.name ?? undefined}
        actions={
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="h-9 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 p-2 shadow-sm ring-1 ring-gray-100">
        <DateRangePicker
          since={draftSince}
          until={draftUntil}
          onChange={({ since: s, until: u }) => {
            setDraftSince(s)
            setDraftUntil(u)
          }}
        />
        <Button
          type="button"
          onClick={handleApplyDateRange}
          disabled={!dateRangeValid || searchUnchanged}
          className="h-9 shrink-0 px-4"
        >
          <Search className="w-4 h-4 mr-2" />
          Buscar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-4 h-4" /> Métricas normalizadas por plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Plataforma</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600">Gasto</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600">Impresiones</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600">Clics</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600">CTR</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600">CPC</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600">CPM</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600">Conv.</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600">ROAS</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600">Ingresos</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r.key} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        <span>{r.title}</span>
                        {r.status === "loading" && (
                          <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                        )}
                        {r.status === "not_connected" && (
                          <span className="text-xs text-gray-400">(sin cuenta conectada)</span>
                        )}
                        {r.status === "error" && (
                          <span
                            className="text-xs text-red-500 inline-flex items-center gap-1"
                            title={r.error}
                          >
                            <AlertCircle className="w-3.5 h-3.5" /> error
                          </span>
                        )}
                      </div>
                      {r.accountName && (
                        <div className="text-xs text-gray-400 mt-0.5">{r.accountName}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {fmtCurrency(r.metrics?.spend, r.currency)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {fmt(r.metrics?.impressions)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {fmt(r.metrics?.clicks)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {fmtPct(r.metrics?.ctr)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {fmtCurrency(r.metrics?.cpc, r.currency)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {fmtCurrency(r.metrics?.cpm, r.currency)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {fmt(r.metrics?.conversions)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {fmtMultiplier(r.metrics?.roas)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {(toNum(r.metrics?.revenue) ?? 0) > 0
                        ? fmtCurrency(r.metrics?.revenue, r.currency)
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/platforms/${platformUrlSlug(r.key)}`)}
                      >
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
                {totals && (
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-3 py-2.5">Total</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {fmtCurrency(totals.spend)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(totals.impressions)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(totals.clicks)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmtPct(totals.ctr)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmtCurrency(totals.cpc)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmtCurrency(totals.cpm)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {fmt(totals.conversions)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {fmtMultiplier(totals.roas)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {fmtCurrency(totals.revenue)}
                    </td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Las monedas pueden variar entre cuentas; los totales suman los valores nominales sin
            conversión. Para comparación estricta usa cuentas en la misma moneda.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
