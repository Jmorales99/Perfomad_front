import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { getProfile } from "@/infrastructure/api/profileRepository"
import { useNavigate } from "react-router-dom"

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ name: string; email: string }>({ name: "", email: "" })
  const navigate = useNavigate()

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
        <Tabs defaultValue="profile" className="w-full">
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
                <h2 className="text-xl font-semibold text-blue-700">Integraciones</h2>
              </CardHeader>
              <CardContent className="space-y-6">
                <IntegrationCard
                  name="Meta Ads"
                  description="Conecta tu cuenta de Facebook Ads para importar campañas y audiencias."
                  connected={true}
                />
                <IntegrationCard
                  name="Google Ads"
                  description="Vincula tu cuenta de Google Ads para sincronizar conversiones."
                  connected={false}
                />
                <IntegrationCard
                  name="LinkedIn Ads"
                  description="Sincroniza tus campañas de LinkedIn para reportes unificados."
                  connected={false}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function IntegrationCard({
  name,
  description,
  connected,
}: {
  name: string
  description: string
  connected: boolean
}) {
  return (
    <div className="flex justify-between items-center border p-4 rounded-xl bg-white/80 backdrop-blur-sm hover:shadow-md transition">
      <div>
        <h3 className="font-semibold text-gray-800">{name}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
      {connected ? (
        <Button variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
          Conectado
        </Button>
      ) : (
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">Conectar</Button>
      )}
    </div>
  )
}
