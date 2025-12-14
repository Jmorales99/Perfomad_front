import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import type { Platform } from "@/infrastructure/api/subscriptionRepository"

interface ConnectAccountModalProps {
  open: boolean
  platform: Platform
  platformName: string
  onClose: () => void
  onSuccess: () => void
}

export function ConnectAccountModal({
  open,
  platform,
  platformName,
  onClose,
  onSuccess,
}: ConnectAccountModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Import here to avoid circular dependencies
      const { connectAccount } = await import("@/infrastructure/api/subscriptionRepository")
      
      await connectAccount(platform, {
        email: formData.email,
        password: formData.password,
      })

      // Reset form
      setFormData({ email: "", password: "" })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Error al conectar cuenta. Verifica tus credenciales.")
    } finally {
      setLoading(false)
    }
  }

  const platformIcons: Record<Platform, string> = {
    meta: "f",
    google_ads: "G",
    linkedin: "in",
  }

  const platformColors: Record<Platform, string> = {
    meta: "bg-blue-600",
    google_ads: "bg-red-600",
    linkedin: "bg-blue-500",
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${platformColors[platform]} flex items-center justify-center text-white text-xl font-bold`}>
              {platformIcons[platform]}
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                Conectar {platformName}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Ingresa tus credenciales para conectar tu cuenta
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="email">Email o Usuario</Label>
            <Input
              id="email"
              type="text"
              placeholder={`tu@email.com o usuario_${platform}`}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <p>
              <strong>Nota:</strong> Esta es una simulación. Cualquier credencial será aceptada para fines de demostración.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className={`${platformColors[platform]} hover:opacity-90 text-white`}
              disabled={loading || !formData.email || !formData.password}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Conectar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

