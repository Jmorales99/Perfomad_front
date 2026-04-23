import { useEffect, useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import { fmtMoney, fmtNumber } from "./shared/formatters"

function AdSetChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-700">{value}</span>
    </span>
  )
}
import {
  listAdSetAds,
  listCampaignAdSets,
  type AdDetail,
  type AdSetSummary,
} from "@/infrastructure/api/optimizationRepository"
import AdCreativeCard from "./shared/AdCreativeCard"
import MediaPreviewDialog, {
  type PreviewRequest,
} from "./shared/MediaPreviewDialog"

interface AdsHierarchyModalProps {
  campaignId: string
  campaignName: string
  open: boolean
  onClose: () => void
  /** Required when campaignId is a platform-native id (not internal UUID). */
  clientId?: string
  platform?: "meta" | "google_ads" | "linkedin" | "tiktok"
  since?: string
  until?: string
}

/**
 * Outer modal that lists ad sets for a campaign and their ads on demand.
 *
 * The creative preview (image/video full-screen) is delegated entirely to
 * `MediaPreviewDialog`, which is a separate Radix Dialog. Because Radix
 * `DismissableLayer` maintains an internal stack of layers, the preview
 * automatically becomes the topmost layer when opened: the outer Dialog
 * stops reacting to pointer-outside / Escape events while the preview is
 * visible, and recovers them when it closes — without any manual
 * `stopPropagation` / `preventDefault` plumbing.
 */
export default function AdsHierarchyModal({
  campaignId,
  campaignName,
  open,
  onClose,
  clientId,
  platform: platformProp,
  since,
  until,
}: AdsHierarchyModalProps) {
  const [adsets, setAdsets] = useState<AdSetSummary[]>([])
  const [platform, setPlatform] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [adsByAdset, setAdsByAdset] = useState<Record<string, AdDetail[]>>({})
  const [loadingAds, setLoadingAds] = useState<Record<string, boolean>>({})
  const [preview, setPreview] = useState<PreviewRequest | null>(null)

  const loadAdsets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listCampaignAdSets(campaignId, {
        clientId,
        platform: platformProp,
        since,
        until,
      })
      setAdsets(data.adsets)
      setPlatform(data.platform)
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Error cargando ad sets")
    } finally {
      setLoading(false)
    }
  }, [campaignId, clientId, platformProp, since, until])

  useEffect(() => {
    if (open) {
      loadAdsets()
    } else {
      setExpanded({})
      setAdsByAdset({})
      setPreview(null)
    }
  }, [open, loadAdsets])

  const handleExpand = async (adsetId: string) => {
    const willExpand = !expanded[adsetId]
    setExpanded((prev) => ({ ...prev, [adsetId]: willExpand }))
    if (willExpand && !adsByAdset[adsetId]) {
      setLoadingAds((prev) => ({ ...prev, [adsetId]: true }))
      try {
        const data = await listAdSetAds(campaignId, adsetId, {
          clientId,
          platform: platformProp,
        })
        setAdsByAdset((prev) => ({ ...prev, [adsetId]: data.ads }))
      } catch (err: any) {
        setAdsByAdset((prev) => ({ ...prev, [adsetId]: [] }))
        console.error("Error loading ads for ad set:", adsetId, err)
      } finally {
        setLoadingAds((prev) => ({ ...prev, [adsetId]: false }))
      }
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Creativos por ad set — {campaignName}
              {platform && <Badge variant="outline">{platform}</Badge>}
            </DialogTitle>
          </DialogHeader>

          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Cargando ad sets…
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && adsets.length === 0 && (
            <p className="text-sm text-gray-500 py-6 text-center">
              No hay ad sets disponibles para esta campaña.
            </p>
          )}

          <div className="space-y-2">
            {adsets.map((adset) => {
              const isOpen = !!expanded[adset.adset_id]
              const ads = adsByAdset[adset.adset_id] ?? []
              const loadingAdsForSet = !!loadingAds[adset.adset_id]
              return (
                <Card key={adset.adset_id} className="border-gray-200">
                  <CardContent className="p-3">
                    <button
                      type="button"
                      onClick={() => handleExpand(adset.adset_id)}
                      className="w-full text-left flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900 truncate">
                              {adset.name || adset.adset_id}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {adset.status}
                            </Badge>
                            {adset.optimization_goal && (
                              <Badge
                                variant="outline"
                                className="text-xs text-gray-600"
                              >
                                {adset.optimization_goal}
                              </Badge>
                            )}
                          </div>
                          {(() => {
                            const chips: { label: string; value: string }[] = []
                            const daily = adset.daily_budget ?? 0
                            const lifetime = adset.lifetime_budget ?? 0
                            if (daily > 0) chips.push({ label: "diario", value: fmtMoney(daily) })
                            else if (lifetime > 0) chips.push({ label: "total", value: fmtMoney(lifetime) })
                            const spend = adset.metrics?.spend ?? 0
                            if (spend > 0) chips.push({ label: "gasto", value: fmtMoney(spend) })
                            const impr = adset.metrics?.impressions ?? 0
                            if (impr > 0) chips.push({ label: "impr.", value: fmtNumber(impr) })
                            const clicks = adset.metrics?.clicks ?? 0
                            if (clicks > 0) chips.push({ label: "clicks", value: fmtNumber(clicks) })
                            if (chips.length === 0) return null
                            return (
                              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                {chips.map((c) => (
                                  <AdSetChip key={c.label} label={c.label} value={c.value} />
                                ))}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {loadingAdsForSet ? (
                          <div className="flex items-center justify-center py-6 text-gray-500 text-sm">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cargando creativos…
                          </div>
                        ) : ads.length === 0 ? (
                          <p className="text-xs text-gray-500 py-3 text-center">
                            Sin creativos en este ad set.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {ads.map((ad) => (
                              <AdCreativeCard
                                key={ad.ad_id}
                                ad={ad}
                                adsetId={adset.adset_id}
                                onOpenPreview={setPreview}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="pt-4 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MediaPreviewDialog
        open={!!preview}
        media={preview?.kind === "single" ? preview.media : null}
        items={preview?.kind === "gallery" ? preview.items : undefined}
        initialIndex={
          preview?.kind === "gallery" ? preview.initialIndex : undefined
        }
        onClose={() => setPreview(null)}
      />
    </>
  )
}
