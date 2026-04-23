import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useClient } from "@/app/providers/ClientProvider"
import { useSubscriptionGate } from "@/interface/hooks/useSubscriptionGate"
import {
  getTikTokConnectLink,
  listTikTokAdvertisers,
  selectTikTokAdvertiser,
  disconnectTikTok,
  getTikTokAccounts,
  type TikTokAdvertiser,
} from "@/infrastructure/repositories/integrations/tiktokRepository"
import { getPlatformAccountMetrics } from "@/infrastructure/api/platformRepository"
import { ApiError } from "@/infrastructure/api/errors"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  TrendingUp,
  Eye,
  MousePointerClick,
  Link2,
  Loader2,
  Unplug,
} from "lucide-react"

function defaultSince() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

function defaultUntil() {
  return new Date().toISOString().slice(0, 10)
}

export default function TikTokPage() {
  const navigate = useNavigate()
  const { selectedClientId, setTikTokStatus } = useClient()
  const { canAct, openPaywall, PaywallModal } = useSubscriptionGate()

  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [advertisers, setAdvertisers] = useState<TikTokAdvertiser[]>([])
  const [selectionPending, setSelectionPending] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [accountName, setAccountName] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selecting, setSelecting] = useState(false)

  const [metricsLoading, setMetricsLoading] = useState(false)
  const [metricsError, setMetricsError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof getPlatformAccountMetrics>> | null>(null)

  const refresh = useCallback(async () => {
    if (!selectedClientId) {
      setLoading(false)
      setAdvertisers([])
      setSelectionPending(false)
      setIsConnected(false)
      setAccountName(null)
      return
    }
    setLoading(true)
    setMetricsError(null)
    try {
      const res = await listTikTokAdvertisers(selectedClientId)
      const accounts = await getTikTokAccounts(selectedClientId).catch(() => [])
      const active = accounts.filter((a) => a.is_active)
      setAdvertisers(res.advertisers)
      setSelectionPending(res.selectionPending && res.advertisers.length > 0)
      setIsConnected(res.isConnected)
      const primary = active[0]
      setAccountName(primary?.account_name ?? null)

      setTikTokStatus(selectedClientId, {
        connected: res.isConnected,
        accountCount: active.length,
        lastSync: primary?.last_synced_at ?? null,
        selectionPending: res.selectionPending && res.advertisers.length > 0,
      })

      if (res.isConnected && !res.selectionPending && selectedClientId) {
        setMetricsLoading(true)
        try {
          const m = await getPlatformAccountMetrics("tiktok", {
            clientId: selectedClientId,
            since: defaultSince(),
            until: defaultUntil(),
          })
          setMetrics(m)
        } catch (e) {
          setMetrics(null)
          setMetricsError(e instanceof Error ? e.message : "No se pudieron cargar las métricas")
        } finally {
          setMetricsLoading(false)
        }
      } else {
        setMetrics(null)
      }
    } catch (e) {
      setMetricsError(e instanceof Error ? e.message : "Error al cargar TikTok")
    } finally {
      setLoading(false)
    }
  }, [selectedClientId, setTikTokStatus])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleConnect = async () => {
    if (!canAct) {
      openPaywall()
      return
    }
    if (!selectedClientId) {
      navigate("/brands")
      return
    }
    setConnecting(true)
    try {
      const redirectUri = `${window.location.origin}/settings?tab=integrations`
      const { url } = await getTikTokConnectLink(selectedClientId, redirectUri)
      window.location.href = url
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.serverMessage || err.message)
      } else {
        alert("No se pudo iniciar la conexión con TikTok.")
      }
    } finally {
      setConnecting(false)
    }
  }

  const handleSelectAdvertiser = async (advertiserId: string) => {
    if (!selectedClientId) return
    setSelecting(true)
    try {
      await selectTikTokAdvertiser(selectedClientId, advertiserId)
      setPickerOpen(false)
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo seleccionar el anunciante")
    } finally {
      setSelecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!selectedClientId) return
    if (!confirm("¿Desconectar TikTok para esta marca?")) return
    setDisconnecting(true)
    try {
      await disconnectTikTok(selectedClientId)
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo desconectar")
    } finally {
      setDisconnecting(false)
    }
  }

  if (!selectedClientId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">Selecciona una marca para gestionar TikTok.</p>
              <Button onClick={() => navigate("/brands")}>Ir a marcas</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">TikTok Ads</h1>
            <p className="text-gray-600">
              Conecta tu cuenta y elige el anunciante. Las métricas detalladas dependen de la API en servidor
              (pueden mostrarse en cero mientras se completa el reporting).
            </p>
          </div>
          <div className="flex gap-2">
            {isConnected && !selectionPending && (
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="gap-2"
              >
                {disconnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unplug className="w-4 h-4" />
                )}
                Desconectar
              </Button>
            )}
            {(!isConnected || selectionPending) && (
              <Button className="gap-2 bg-gray-900 hover:bg-gray-800" onClick={handleConnect} disabled={connecting}>
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {selectionPending ? "Reconectar OAuth" : "Conectar TikTok"}
              </Button>
            )}
          </div>
        </div>

        {selectionPending && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50">
            <CardContent className="p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-800">Selecciona un anunciante</p>
                <p className="text-sm text-gray-600">
                  TikTok autorizó tu app; elige la cuenta publicitaria para esta marca.
                </p>
              </div>
              <Button onClick={() => setPickerOpen(true)} className="bg-amber-600 hover:bg-amber-700">
                Elegir anunciante
              </Button>
            </CardContent>
          </Card>
        )}

        {!isConnected && !selectionPending && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Conecta TikTok</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Usa el botón Conectar para abrir el flujo OAuth. También puedes hacerlo desde Configuración →
                Integraciones.
              </p>
              <Button className="gap-2 bg-gray-900 hover:bg-gray-800" onClick={handleConnect} disabled={connecting}>
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                Conectar TikTok
              </Button>
            </CardContent>
          </Card>
        )}

        {isConnected && !selectionPending && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Estado de conexión</CardTitle>
                  <Badge variant="default">Conectado</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Cuenta: <span className="font-semibold">{accountName ?? "—"}</span>
                </p>
              </CardContent>
            </Card>

            {metricsLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}

            {metricsError && (
              <Card className="border-red-200">
                <CardContent className="p-4 text-sm text-red-700">{metricsError}</CardContent>
              </Card>
            )}

            {metrics && !metricsLoading && (
              <>
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
                      <p className="text-2xl font-bold text-purple-600">{metrics.metrics.ctr.toFixed(2)}%</p>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-xs text-gray-500">
                  Rango: {metrics.dateRange.since} — {metrics.dateRange.until}. Gasto (USD):{" "}
                  {metrics.metrics.spend?.toFixed?.(2) ?? metrics.metrics.spend}
                </p>
              </>
            )}
          </div>
        )}

        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Elegir anunciante TikTok</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-72 overflow-y-auto py-2">
              {advertisers.map((adv) => (
                <Button
                  key={adv.id}
                  variant="outline"
                  className="w-full justify-start h-auto py-3 px-3"
                  disabled={selecting}
                  onClick={() => void handleSelectAdvertiser(adv.id)}
                >
                  <span className="text-left font-medium">{adv.name}</span>
                  <span className="text-xs text-gray-500 ml-2">ID: {adv.id}</span>
                </Button>
              ))}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setPickerOpen(false)} disabled={selecting}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <PaywallModal />
    </div>
  )
}
