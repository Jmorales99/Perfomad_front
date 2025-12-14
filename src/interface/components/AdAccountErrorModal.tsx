import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { AdAccountError } from "@/infrastructure/api/campaignsRepository"

interface AdAccountErrorModalProps {
  error: AdAccountError
  open: boolean
  onClose: () => void
}

export function AdAccountErrorModal({ error, open, onClose }: AdAccountErrorModalProps) {
  const navigate = useNavigate()

  const handleConnectAccounts = () => {
    onClose()
    // Navigate to integrations tab in settings
    navigate("/settings?tab=integrations")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {error.title || error.message}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-base text-gray-600 pt-2">
            {error.details || error.message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Missing Platforms List */}
          {error.missing_platform_names && error.missing_platform_names.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Plataformas que necesitas conectar:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {error.missing_platform_names.map((platform, index) => (
                  <li key={index} className="text-sm text-blue-700">
                    {platform}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Required */}
          {error.action_required && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <strong>Acción requerida:</strong> {error.action_required}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConnectAccounts}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {error.action_button_text || "Conectar cuentas ahora"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

