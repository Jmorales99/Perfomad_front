import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Sparkles, Search, Loader2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCampaigns, type CampaignDTO, type Platform } from "@/infrastructure/api/campaignsRepository"
import {
  listMultichannelCampaigns,
  type MultichannelCampaign,
} from "@/infrastructure/api/multichannelCampaignsRepository"
import { useClient } from "@/app/providers/ClientProvider"
import { ApiError } from "@/infrastructure/api/errors"

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta",
  google_ads: "Google Ads",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-700",
  draft: "bg-blue-100 text-blue-700",
  publishing: "bg-blue-100 text-blue-700",
  partial_failed: "bg-orange-100 text-orange-700",
}

type UnifiedRow =
  | { type: "simple"; data: CampaignDTO }
  | { type: "multichannel"; data: MultichannelCampaign }

export default function OptimizationPage() {
  const navigate = useNavigate()
  const { selectedClientId } = useClient()

  const [allSimple, setAllSimple] = useState<CampaignDTO[]>([])
  const [allMulti, setAllMulti] = useState<MultichannelCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [simple, multi] = await Promise.all([
          getCampaigns(),
          listMultichannelCampaigns(selectedClientId),
        ])
        setAllSimple(simple)
        setAllMulti(multi)
      } catch (e) {
        setError(e instanceof ApiError ? e.serverMessage ?? e.message : "Error al cargar campañas.")
      } finally {
        setLoading(false)
      }
    })()
  }, [selectedClientId])

  const rows = useMemo((): UnifiedRow[] => {
    const q = search.toLowerCase().trim()
    const simple: UnifiedRow[] = allSimple
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .map((d) => ({ type: "simple", data: d }))
    const multi: UnifiedRow[] = allMulti
      .filter((mc) => !q || mc.name.toLowerCase().includes(q))
      .map((d) => ({ type: "multichannel", data: d }))
    return [...simple, ...multi]
  }, [allSimple, allMulti, search])

  const handleRowClick = (row: UnifiedRow) => {
    if (row.type === "simple") {
      navigate(`/optimize/${row.data.id}`)
    } else {
      // Multichannel: navigate to the linked simple campaign if available
      const linkedId = row.data.campaign?.id
      if (linkedId) {
        navigate(`/optimize/${linkedId}`)
      } else {
        navigate(`/campaigns/multichannel/${row.data.id}`)
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Optimización con IA</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Selecciona una campaña para analizar y recibir recomendaciones de Claude.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar campaña..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">Sin campañas</p>
            <p className="text-gray-400 text-sm">
              {search ? "No hay campañas que coincidan con la búsqueda." : "Crea tu primera campaña desde Mis Campañas."}
            </p>
            {!search && (
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/campaigns")}>
                Ir a Mis Campañas
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-gray-700">
              {rows.length} campaña{rows.length !== 1 ? "s" : ""} disponible{rows.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {rows.map((row) => {
                const id = row.type === "simple" ? row.data.id : row.data.id
                const name = row.data.name
                const status = row.data.status
                const platforms: Platform[] =
                  row.type === "simple"
                    ? (Array.isArray(row.data.platforms) ? row.data.platforms : [row.data.platforms ?? "meta"])
                    : row.data.platforms
                const isMulti = row.type === "multichannel"

                return (
                  <button
                    key={id}
                    onClick={() => handleRowClick(row)}
                    className="w-full text-left px-4 py-3.5 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-gray-800 truncate">{name}</span>
                          {isMulti && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs shrink-0">Multicanal</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`text-xs ${STATUS_COLORS[status] || "bg-gray-100 text-gray-600"}`}>
                            {status === "active" ? "Activa" : status === "paused" ? "Pausada" : status}
                          </Badge>
                          {platforms.map((p) => (
                            <span key={p} className="text-xs text-gray-400">
                              {PLATFORM_LABELS[p] ?? p}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                          Optimizar →
                        </span>
                        <Sparkles className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
