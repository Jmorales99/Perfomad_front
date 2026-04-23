import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useClient } from "@/app/providers/ClientProvider"
import { useSubscriptionGate } from "@/interface/hooks/useSubscriptionGate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Link2, Loader2, RefreshCw, Search } from "lucide-react"
import { ApiError, isReconnectError } from "@/infrastructure/api/errors"
import { importPlatformCampaign } from "@/infrastructure/api/platformRepository"
import PlatformHeader from "@/interface/components/platforms/shared/PlatformHeader"
import AccountSelector from "@/interface/components/platforms/shared/AccountSelector"
import DateRangePicker from "@/interface/components/platforms/shared/DateRangePicker"
import PlatformKpis, { type NormalizedMetrics } from "@/interface/components/platforms/shared/PlatformKpis"
import GenericCampaignsTable, {
  type NormalizedCampaignRow,
} from "@/interface/components/platforms/shared/GenericCampaignsTable"
import {
  getPlatformAdapter,
  type PlatformAdapter,
  type PlatformAdAccount,
} from "@/interface/components/platforms/shared/platformConfig"
import { defaultSince, defaultUntil } from "@/interface/components/platforms/shared/formatters"

function storageKey(platformKey: string, clientId: string) {
  return `${platformKey}_ad_account_${clientId}`
}

export default function PlatformPage() {
  const { platform: platformParam } = useParams<{ platform: string }>()
  const navigate = useNavigate()
  const { selectedClientId, selectedClient } = useClient()
  const { canAct, openPaywall, PaywallModal } = useSubscriptionGate()

  const adapter: PlatformAdapter | null = useMemo(
    () => getPlatformAdapter(platformParam ?? ""),
    [platformParam]
  )

  const [accounts, setAccounts] = useState<PlatformAdAccount[]>([])
  const [adAccountId, setAdAccountId] = useState<string>("")
  const defS = defaultSince()
  const defU = defaultUntil()
  /** Range sent to the API (updated on mount and when user clicks Buscar). */
  const [appliedSince, setAppliedSince] = useState<string>(defS)
  const [appliedUntil, setAppliedUntil] = useState<string>(defU)
  /** Draft range edited in the date picker (no API calls until Buscar). */
  const [draftSince, setDraftSince] = useState<string>(defS)
  const [draftUntil, setDraftUntil] = useState<string>(defU)

  const [metrics, setMetrics] = useState<NormalizedMetrics | null>(null)
  const [currency, setCurrency] = useState<string>("USD")
  const [accountName, setAccountName] = useState<string | undefined>()
  const [campaigns, setCampaigns] = useState<NormalizedCampaignRow[]>([])

  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [errorAccounts, setErrorAccounts] = useState<string | null>(null)
  const [errorMetrics, setErrorMetrics] = useState<string | null>(null)
  const [errorCampaigns, setErrorCampaigns] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const metricsReqRef = useRef(0)

  // Restore selected ad account per client+platform before paint so we never
  // request metrics with the previous platform's account id (same route component,
  // no remount when switching Meta ↔ Google in the sidebar).
  useLayoutEffect(() => {
    if (!adapter || !selectedClientId) return
    const saved = localStorage.getItem(storageKey(adapter.key, selectedClientId))
    setAdAccountId(saved ?? "")
    setErrorMetrics(null)
    setErrorCampaigns(null)
  }, [adapter, selectedClientId])

  useEffect(() => {
    if (!adapter || !selectedClientId || !adAccountId) return
    localStorage.setItem(storageKey(adapter.key, selectedClientId), adAccountId)
  }, [adapter, selectedClientId, adAccountId])

  // Load connected accounts
  const loadAccounts = useCallback(async () => {
    if (!adapter || !selectedClientId) return
    setLoadingAccounts(true)
    setErrorAccounts(null)
    try {
      const accs = await adapter.listAccounts(selectedClientId)
      const active = accs.filter((a) => a.is_active)
      setAccounts(active)
      const currentIsValid = active.some((a) => a.platform_account_id === adAccountId)
      if (active.length > 0 && (!adAccountId || !currentIsValid)) {
        setAdAccountId(active[0].platform_account_id)
      } else if (active.length === 0) {
        setAdAccountId("")
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "No pudimos cargar las cuentas."
      setErrorAccounts(msg)
      setAccounts([])
    } finally {
      setLoadingAccounts(false)
    }
  }, [adapter, selectedClientId, adAccountId])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  // Load metrics + campaigns
  const loadMetricsAndCampaigns = useCallback(async () => {
    if (!adapter || !selectedClientId || !adAccountId) return
    const reqId = ++metricsReqRef.current
    setLoadingMetrics(true)
    setErrorMetrics(null)
    try {
      const res = await adapter.getMetrics({
        clientId: selectedClientId,
        adAccountId,
        since: appliedSince,
        until: appliedUntil,
      })
      if (reqId !== metricsReqRef.current) return
      setMetrics(res.metrics)
      setCurrency(res.currency || "USD")
      setAccountName(res.accountName)
    } catch (e) {
      if (reqId !== metricsReqRef.current) return
      if (isReconnectError(e)) {
        setErrorMetrics("Tu sesión con la plataforma expiró. Vuelve a conectar la cuenta.")
      } else {
        setErrorMetrics(
          e instanceof ApiError
            ? e.serverMessage?.trim() || e.message
            : "No pudimos cargar las métricas."
        )
      }
      setMetrics(null)
    } finally {
      if (reqId === metricsReqRef.current) setLoadingMetrics(false)
    }

    if (adapter.getCampaigns) {
      setLoadingCampaigns(true)
      setErrorCampaigns(null)
      try {
        const cRes = await adapter.getCampaigns({
          clientId: selectedClientId,
          adAccountId,
          since: appliedSince,
          until: appliedUntil,
        })
        if (reqId !== metricsReqRef.current) return
        setCampaigns(cRes.campaigns)
      } catch (e) {
        if (reqId !== metricsReqRef.current) return
        setErrorCampaigns(
          e instanceof ApiError
            ? e.serverMessage?.trim() || e.message
            : "No pudimos cargar las campañas."
        )
        setCampaigns([])
      } finally {
        if (reqId === metricsReqRef.current) setLoadingCampaigns(false)
      }
    } else {
      setCampaigns([])
    }
  }, [adapter, selectedClientId, adAccountId, appliedSince, appliedUntil])

  useEffect(() => {
    loadMetricsAndCampaigns()
  }, [loadMetricsAndCampaigns])

  const handleRefresh = async () => {
    setRefreshing(true)
    setDraftSince(appliedSince)
    setDraftUntil(appliedUntil)
    await Promise.all([loadAccounts(), loadMetricsAndCampaigns()])
    setRefreshing(false)
  }

  const dateRangeValid = draftSince <= draftUntil
  const searchUnchanged =
    draftSince === appliedSince && draftUntil === appliedUntil

  const handleApplyDateRange = () => {
    if (!dateRangeValid) return
    setAppliedSince(draftSince)
    setAppliedUntil(draftUntil)
  }

  const handleConnect = async () => {
    if (!adapter?.getConnectLink || !selectedClientId) return
    if (!canAct) return openPaywall()
    setConnecting(true)
    try {
      const { url } = await adapter.getConnectLink(selectedClientId)
      window.location.href = url
    } catch (e) {
      setErrorAccounts(
        e instanceof ApiError ? e.message : "No pudimos iniciar la conexión."
      )
    } finally {
      setConnecting(false)
    }
  }

  const handleReconnect = () => handleConnect()

  const handleOptimize = async (row: NormalizedCampaignRow) => {
    if (!adapter || !selectedClientId) return
    if (!canAct) {
      openPaywall()
      return
    }
    try {
      const { id } = await importPlatformCampaign(
        adapter.backendKey,
        row.campaign_id,
        { clientId: selectedClientId, adAccountId }
      )
      navigate(`/optimize/${id}`)
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.serverMessage?.trim() || e.message
          : "No pudimos importar la campaña para optimizar."
      setErrorCampaigns(msg)
    }
  }

  if (!adapter) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate("/home")}>
          Volver
        </Button>
        <div className="mt-6 text-center text-gray-500">
          Plataforma desconocida: <code>{platformParam}</code>
        </div>
      </div>
    )
  }

  if (!selectedClientId) {
    return (
      <div className="p-6">
      <PlatformHeader
        title={adapter.title}
        brandName={adapter.brandName}
      />
      <Card className="mt-6">
          <CardContent className="py-10 text-center text-gray-500">
            Selecciona una marca para ver sus métricas.
          </CardContent>
        </Card>
      </div>
    )
  }

  const showConnectEmpty =
    !loadingAccounts && accounts.length === 0 && adapter.getConnectLink != null

  return (
    <div className="p-6 space-y-6">
      <PaywallModal />

      <PlatformHeader
        title={adapter.title}
        brandName={selectedClient?.name ?? adapter.brandName}
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

      {showConnectEmpty ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" /> Conectar {adapter.brandName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Aún no hay cuentas publicitarias conectadas para esta marca.
            </p>
            {errorAccounts && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorAccounts}</span>
              </div>
            )}
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4 mr-2" />
              )}
              Conectar {adapter.brandName}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 p-2 shadow-sm ring-1 ring-gray-100">
            <AccountSelector
              options={accounts.map((a) => ({
                id: a.platform_account_id,
                label: a.account_name ?? a.platform_account_id,
                currency: a.currency,
              }))}
              value={adAccountId || null}
              onChange={setAdAccountId}
            />
            <div className="hidden h-7 w-px shrink-0 bg-gray-200 sm:block" aria-hidden />
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

          {errorMetrics && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Error al cargar métricas</p>
                <p className="text-xs text-red-600 mt-0.5">{errorMetrics}</p>
                {adapter.getConnectLink && (
                  <button
                    onClick={handleReconnect}
                    className="mt-2 text-xs font-medium text-red-700 underline"
                  >
                    Reconectar {adapter.brandName}
                  </button>
                )}
              </div>
            </div>
          )}

          {loadingMetrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : metrics ? (
            <PlatformKpis metrics={metrics} currency={currency} />
          ) : null}

          {adapter.getCampaigns && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Campañas {accountName ? `· ${accountName}` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GenericCampaignsTable
                  campaigns={campaigns}
                  loading={loadingCampaigns}
                  error={errorCampaigns}
                  currency={currency}
                  onRetry={loadMetricsAndCampaigns}
                  onReconnect={adapter.getConnectLink ? handleReconnect : undefined}
                  supportsAdsHierarchy={adapter.supportsAdsHierarchy}
                  platformKey={adapter.backendKey as "meta" | "google_ads" | "linkedin" | "tiktok"}
                  since={appliedSince}
                  until={appliedUntil}
                  onOptimize={adapter.supportsOptimization ? handleOptimize : undefined}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}

    </div>
  )
}
