import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, CheckCircle2, Loader2 } from "lucide-react"
import { syncBudgetFromPlatform } from "@/infrastructure/api/optimizationRepository"

interface BudgetDriftBadgeProps {
  campaignId: string
  status?: "in_sync" | "drifted" | "unknown" | "error" | null
  driftPct?: number | null
  localDaily?: number | null
  platformDaily?: number | null
  onSynced?: () => void
}

export default function BudgetDriftBadge({
  campaignId,
  status,
  driftPct,
  localDaily,
  platformDaily,
  onSynced,
}: BudgetDriftBadgeProps) {
  const [syncing, setSyncing] = useState<"none" | "promote" | "refresh">("none")
  const [error, setError] = useState<string | null>(null)

  const handleSync = async (promote: boolean) => {
    setSyncing(promote ? "promote" : "refresh")
    setError(null)
    try {
      await syncBudgetFromPlatform(campaignId, promote)
      onSynced?.()
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Error sincronizando presupuesto")
    } finally {
      setSyncing("none")
    }
  }

  if (!status || status === "unknown") return null

  if (status === "in_sync") {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-300 inline-flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        Presupuesto en sincronía
      </Badge>
    )
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-red-100 text-red-700 border-red-300 inline-flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Error sincronizando presupuesto
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSync(false)}
          disabled={syncing !== "none"}
        >
          {syncing === "refresh" ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-1" />
          )}
          Reintentar
        </Button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    )
  }

  return (
    <div className="p-3 bg-orange-50 border border-orange-200 rounded-md space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-600" />
        <span className="text-sm font-medium text-orange-800">
          Presupuesto desincronizado
          {typeof driftPct === "number" ? ` (${driftPct.toFixed(1)}%)` : ""}
        </span>
      </div>
      <p className="text-sm text-orange-700">
        Tu presupuesto en la plataforma{" "}
        {typeof platformDaily === "number" ? `($${platformDaily.toFixed(2)}/día)` : ""}{" "}
        difiere del registrado aquí
        {typeof localDaily === "number" ? ` ($${localDaily.toFixed(2)}/día)` : ""}.
      </p>
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          onClick={() => handleSync(true)}
          disabled={syncing !== "none"}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          {syncing === "promote" ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3 mr-1" />
          )}
          Usar el de la plataforma
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSync(false)}
          disabled={syncing !== "none"}
        >
          {syncing === "refresh" ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-1" />
          )}
          Volver a comparar
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
