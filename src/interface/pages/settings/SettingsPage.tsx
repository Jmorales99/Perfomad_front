import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { getProfile } from "@/infrastructure/api/profileRepository"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  getConnectedAccounts,
  syncConnectedAccounts,
  type ConnectedAccount,
  type Platform,
} from "@/infrastructure/api/subscriptionRepository"
import { CheckCircle2, RefreshCw } from "lucide-react"
import { ConnectAccountModal } from "@/interface/components/ConnectAccountModal"

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ name: string; email: string }>({ name: "", email: "" })
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "profile"

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile()
        setProfile({ name: data.name, email: data.email })
      } catch (e) {
        console.error("Error al obtener perfil", e)
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const data = await getConnectedAccounts()
      setAccounts(data.accounts || [])
    } catch (e) {
      console.error("Error al obtener cuentas conectadas:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (platform: Platform) => {
    // Check if using production Plai API (OAuth flow) or mock API (credentials modal)
    const isProduction = import.meta.env.PROD || import.meta.env.VITE_PLAI_API_URL
    
    if (isProduction) {
      // Production: Use OAuth redirect flow (real Plai API)
      try {
        const { createConnectionLink } = await import("@/infrastructure/api/subscriptionRepository")
        const redirectUri = `${window.location.origin}/settings`
        
        const { link } = await createConnectionLink(platform, redirectUri)
        
        // Redirect user to platform OAuth page (Meta/Google/LinkedIn)
        window.location.href = link
      } catch (e: any) {
        console.error("Error creating connection link:", e)
        alert(e.message || "Error al conectar cuenta. Por favor intenta nuevamente.")
      }
    } else {
      // Development: Show credentials modal (mock API)
      setConnectingPlatform(platform)
    }
  }

  const handleConnectSuccess = async () => {
    // Refresh accounts list after successful connection
    await fetchAccounts()
    setConnectingPlatform(null)
  }

  const handleSync = async () => {
    try {
      await syncConnectedAccounts()
      await fetchAccounts()
      alert("Cuentas sincronizadas correctamente")
    } catch (e: any) {
      console.error("Error al sincronizar:", e)
      alert(e.message || "Error al sincronizar cuentas")
    }
  }

  const isConnected = (platform: Platform): boolean => {
    return accounts.some(
      (acc) => acc.platform === platform && acc.is_active
    )
  }

  const getAccountName = (platform: Platform): string | null => {
    const account = accounts.find(
      (acc) => acc.platform === platform && acc.is_active
    )
    return account?.account_name || null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100 text-gray-900">
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
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

        {/* Tabs */}
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
                  <Input value={profile.name} placeholder="Tu nombre" className="mt-1" />
                </div>
                <div>
                  <Label>Correo electrónico</Label>
                  <Input value={profile.email} placeholder="tu@correo.com" className="mt-1" />
                </div>
                <div>
                  <Label>Idioma</Label>
                  <select className="w-full border rounded-lg p-2 mt-1">
                    <option>Español</option>
                    <option>Inglés</option>
                  </select>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Guardar cambios
                </Button>
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
                  <Label>Método de pago</Label>
                  <p className="text-gray-600 mt-1 text-sm">Visa **** 4829 (último pago hace 5 días)</p>
                  <Button variant="outline" className="mt-2">Actualizar método de pago</Button>
                </div>

                <div>
                  <Label>Plan actual</Label>
                  <p className="text-gray-600 mt-1 text-sm">Plan Profesional — $49/mes</p>
                  <Button variant="outline" className="mt-2">Ver planes</Button>
                </div>

                <div>
                  <Label>Seguridad</Label>
                  <p className="text-gray-600 mt-1 text-sm">Último cambio de contraseña hace 2 meses</p>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Sincronizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <p className="text-center text-gray-500 py-4">Cargando cuentas...</p>
                ) : (
                  <>
                    <IntegrationCard
                      platform="meta"
                      name="Meta Ads"
                      description="Conecta tu cuenta de Facebook Ads para importar campañas y audiencias."
                      connected={isConnected("meta")}
                      accountName={getAccountName("meta")}
                      onConnect={() => handleConnect("meta")}
                    />
                    <IntegrationCard
                      platform="google_ads"
                      name="Google Ads"
                      description="Vincula tu cuenta de Google Ads para sincronizar conversiones."
                      connected={isConnected("google_ads")}
                      accountName={getAccountName("google_ads")}
                      onConnect={() => handleConnect("google_ads")}
                    />
                    <IntegrationCard
                      platform="linkedin"
                      name="LinkedIn Ads"
                      description="Sincroniza tus campañas de LinkedIn para reportes unificados."
                      connected={isConnected("linkedin")}
                      accountName={getAccountName("linkedin")}
                      onConnect={() => handleConnect("linkedin")}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Connection Modal */}
            {connectingPlatform && (
              <ConnectAccountModal
                open={!!connectingPlatform}
                platform={connectingPlatform}
                platformName={
                  connectingPlatform === "meta"
                    ? "Meta Ads"
                    : connectingPlatform === "google_ads"
                    ? "Google Ads"
                    : "LinkedIn Ads"
                }
                onClose={() => setConnectingPlatform(null)}
                onSuccess={handleConnectSuccess}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function IntegrationCard({
  platform,
  name,
  description,
  connected,
  accountName,
  onConnect,
}: {
  platform: Platform
  name: string
  description: string
  connected: boolean
  accountName?: string | null
  onConnect: () => void
}) {
  return (
    <div className="flex justify-between items-center border p-4 rounded-xl bg-white/80 backdrop-blur-sm hover:shadow-md transition">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-800">{name}</h3>
          {connected && (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          )}
        </div>
        <p className="text-gray-600 text-sm mb-1">{description}</p>
        {connected && accountName && (
          <p className="text-xs text-gray-500 mt-1">
            Conectado como: <span className="font-medium">{accountName}</span>
          </p>
        )}
      </div>
      {connected ? (
        <Button
          variant="outline"
          className="text-green-600 border-green-300 hover:bg-green-50 flex items-center gap-2"
          disabled
        >
          <CheckCircle2 className="w-4 h-4" />
          Conectado
        </Button>
      ) : (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onConnect}
            >
              Conectar
            </Button>
      )}
    </div>
  )
}
