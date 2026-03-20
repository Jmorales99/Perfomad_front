import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState, useCallback } from "react"
import { getProfile } from "@/infrastructure/api/profileRepository"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { useAuth } from "@/app/providers/AuthProvider"
import { useClient } from "@/app/providers/ClientProvider"
import {
  getMetaConnectLink,
  syncMetaAccounts,
  type MetaAccount,
} from "@/infrastructure/repositories/integrations/metaRepository"
import { ApiError } from "@/infrastructure/api/errors"
import { CheckCircle2, RefreshCw, AlertCircle, Facebook, Link2, Linkedin } from "lucide-react"

// ── Banner de resultado de conexión OAuth ──────────────────────────────────────
type ConnectResult = { success: true; platform: string } | { success: false; message: string } | null

function ConnectResultBanner({
  result,
  onDismiss,
}: {
  result: ConnectResult
  onDismiss: () => void
}) {
  if (!result) return null
  if (result.success) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3 mb-4">
        <div className="flex items-center gap-2 text-green-800">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">
            ¡{result.platform === "meta" ? "Meta" : result.platform} conectado correctamente!
          </span>
        </div>
        <button onClick={onDismiss} className="text-green-700 text-xs underline">
          Cerrar
        </button>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 mb-4">
      <div className="flex items-center gap-2 text-red-800">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">Error al conectar: {result.message}</span>
      </div>
      <button onClick={onDismiss} className="text-red-700 text-xs underline">
        Cerrar
      </button>
    </div>
  )
}

// ── Card de integración ────────────────────────────────────────────────────────
function IntegrationCard({
  name,
  icon,
  description,
  connected,
  metaAccounts,
  canAct,
  syncing,
  onConnect,
  onSync,
}: {
  name: string
  icon: React.ReactNode
  description: string
  connected: boolean
  metaAccounts?: MetaAccount[]
  canAct: boolean
  syncing?: boolean
  onConnect: () => void
  onSync?: () => void
}) {
  return (
    <div className="flex justify-between items-start border p-4 rounded-xl bg-white/80 backdrop-blur-sm hover:shadow-md transition gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h3 className="font-semibold text-gray-800">{name}</h3>
          {connected && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
        </div>
        <p className="text-gray-600 text-sm mb-2">{description}</p>
        {connected && metaAccounts && metaAccounts.length > 0 && (
          <p className="text-xs text-gray-500">
            {metaAccounts.length} cuenta{metaAccounts.length > 1 ? "s" : ""} sincronizada{metaAccounts.length > 1 ? "s" : ""}
          </p>
        )}
        {!canAct && (
          <p className="text-xs text-amber-600 mt-1">
            Activa tu suscripción para conectar plataformas.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        {connected ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-300 hover:bg-green-50"
              disabled
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Conectado
            </Button>
            {onSync && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSync}
                disabled={!canAct || syncing}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
                Sincronizar
              </Button>
            )}
          </>
        ) : (
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onConnect}
            disabled={!canAct}
          >
            Conectar
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [profile, setProfile] = useState<{ name: string; email: string }>({ name: "", email: "" })
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "profile"

  const { hasSubscription } = useAuth()
  const { selectedClientId, selectedClient, metaStatus, setMetaStatus } = useClient()
  const canAct = hasSubscription

  // Estado Meta (derivado del contexto + local para sesión actual)
  const currentMetaStatus = selectedClientId ? metaStatus[selectedClientId] : null
  const metaConnected = currentMetaStatus?.connected ?? false
  const [syncedAccounts, setSyncedAccounts] = useState<MetaAccount[]>([])
  const [syncing, setSyncing] = useState(false)
  const [connectResult, setConnectResult] = useState<ConnectResult>(null)

  // Leer perfil
  useEffect(() => {
    getProfile()
      .then((d) => setProfile({ name: d.name, email: d.email }))
      .catch(() => {})
  }, [])

  // Leer query params de retorno OAuth y limpiarlos
  useEffect(() => {
    const connect = searchParams.get("connect")
    const platform = searchParams.get("platform")
    const message = searchParams.get("message")

    if (connect === "success" && platform) {
      setConnectResult({ success: true, platform })
      // Marcar Meta como conectado en el contexto si tenemos clientId
      if (platform === "meta" && selectedClientId) {
        setMetaStatus(selectedClientId, {
          connected: true,
          accountCount: 0,
          lastSync: null,
        })
      }
      // Auto-sync si tiene suscripción y hay clientId
      if (canAct && selectedClientId && platform === "meta") {
        handleSyncMeta(selectedClientId)
      }
    } else if (connect === "error") {
      setConnectResult({ success: false, message: message || "Error desconocido" })
    }

    if (connect) {
      // Limpiar query params para no repetir el banner al recargar
      window.history.replaceState(null, "", window.location.pathname + (activeTab !== "profile" ? `?tab=${activeTab}` : ""))
      setSearchParams(activeTab !== "profile" ? { tab: activeTab } : {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSyncMeta = useCallback(async (clientId: string) => {
    setSyncing(true)
    try {
      const result = await syncMetaAccounts(clientId)
      const accounts = result.accounts ?? []
      setSyncedAccounts(accounts)
      setMetaStatus(clientId, {
        connected: true,
        accountCount: accounts.length,
        lastSync: new Date().toISOString(),
      })
    } catch (err) {
      if (err instanceof ApiError && err.code === "subscription_required") {
        alert("Activa tu suscripción para sincronizar cuentas.")
      }
    } finally {
      setSyncing(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId])

  const handleConnectMeta = async () => {
    if (!selectedClientId) {
      navigate("/brands")
      return
    }
    if (!canAct) {
      navigate("/settings?tab=account")
      return
    }
    try {
      const redirectUri = `${window.location.origin}/settings?tab=integrations`
      const { url } = await getMetaConnectLink(selectedClientId, redirectUri)
      window.location.href = url
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.serverMessage || err.message)
      } else {
        alert("Error al obtener el link de conexión.")
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100 text-gray-900">
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 border-blue-200 hover:bg-blue-50 text-blue-700"
          >
            ← Volver
          </Button>
          <h1 className="text-3xl font-bold text-blue-700">Configuración</h1>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setSearchParams({ tab: value })}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full mb-6">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="account">Cuenta</TabsTrigger>
            <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          </TabsList>

          {/* Perfil */}
          <TabsContent value="profile">
            <Card className="border border-blue-100 shadow-sm">
              <CardHeader>
                <h2 className="text-xl font-semibold text-blue-700">Perfil de usuario</h2>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Nombre</Label>
                  <Input value={profile.name} placeholder="Tu nombre" className="mt-1" readOnly />
                </div>
                <div>
                  <Label>Correo electrónico</Label>
                  <Input value={profile.email} placeholder="tu@correo.com" className="mt-1" readOnly />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cuenta */}
          <TabsContent value="account">
            <Card className="border border-blue-100 shadow-sm">
              <CardHeader>
                <h2 className="text-xl font-semibold text-blue-700">Configuración de cuenta</h2>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Plan actual</Label>
                  <p className="text-gray-600 mt-1 text-sm">
                    {hasSubscription ? "Plan activo" : "Plan inactivo — activa para desbloquear funciones"}
                  </p>
                </div>
                <div>
                  <Label>Seguridad</Label>
                  <p className="text-gray-600 mt-1 text-sm">Cambia tu contraseña cuando lo necesites.</p>
                  <Button variant="outline" className="mt-2">Cambiar contraseña</Button>
                </div>
                <div className="border-t pt-6">
                  <Button variant="destructive">Eliminar cuenta</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integraciones */}
          <TabsContent value="integrations">
            <Card className="border border-blue-100 shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-blue-700">Integraciones</h2>
                  {selectedClient && (
                    <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                      Empresa: <span className="font-medium">{selectedClient.name}</span>
                    </span>
                  )}
                </div>
                {!selectedClientId && (
                  <p className="text-sm text-amber-600 mt-2">
                    Primero{" "}
                    <Link to="/brands" className="underline font-medium">
                      crea o selecciona una marca
                    </Link>{" "}
                    para conectar plataformas.
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <ConnectResultBanner
                  result={connectResult}
                  onDismiss={() => setConnectResult(null)}
                />

                <IntegrationCard
                  name="Meta Ads"
                  icon={<Facebook className="w-5 h-5 text-blue-600" />}
                  description="Conecta tu cuenta de Facebook/Instagram Ads para importar campañas y audiencias."
                  connected={metaConnected}
                  metaAccounts={syncedAccounts}
                  canAct={canAct && !!selectedClientId}
                  syncing={syncing}
                  onConnect={handleConnectMeta}
                  onSync={selectedClientId ? () => handleSyncMeta(selectedClientId) : undefined}
                />

                <IntegrationCard
                  name="Google Ads"
                  icon={<Link2 className="w-5 h-5 text-red-500" />}
                  description="Vincula tu cuenta de Google Ads para sincronizar conversiones."
                  connected={false}
                  canAct={false}
                  onConnect={() => alert("Google Ads próximamente.")}
                />

                <IntegrationCard
                  name="LinkedIn Ads"
                  icon={<Linkedin className="w-5 h-5 text-blue-700" />}
                  description="Sincroniza tus campañas de LinkedIn para reportes unificados."
                  connected={false}
                  canAct={false}
                  onConnect={() => alert("LinkedIn Ads próximamente.")}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
