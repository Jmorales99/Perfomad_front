import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, Play, Eye, Film } from "lucide-react"
import type { AdDetail } from "@/infrastructure/api/optimizationRepository"
import type { PreviewRequest } from "./MediaPreviewDialog"
import CarouselCreativeCard from "./CarouselCreativeCard"

interface AdCreativeCardProps {
  ad: AdDetail
  adsetId: string
  onOpenPreview: (request: PreviewRequest) => void
}

/**
 * Visual card for a single ad creative inside an ad set.
 *
 * For carousels the rendering is delegated to `CarouselCreativeCard`,
 * which owns its own slider UI. This component handles the single-media
 * case (image / video / unknown): top media slot with optional play
 * overlay, title, status badges, 3-column metrics grid.
 *
 * Clicking the media emits an `onOpenPreview` payload; the parent uses
 * it to open the standalone `MediaPreviewDialog`. This component does
 * NOT own the preview state.
 */
export default function AdCreativeCard({
  ad,
  adsetId,
  onOpenPreview,
}: AdCreativeCardProps) {
  const creative = ad.creative ?? {}
  const typeKey = (creative.type ?? "").toString().toLowerCase()
  const isCarousel = typeKey.includes("carousel")

  if (isCarousel) {
    return (
      <CarouselCreativeCard
        ad={ad}
        adsetId={adsetId}
        onOpenPreview={onOpenPreview}
      />
    )
  }

  return (
    <SingleCreativeCard
      ad={ad}
      adsetId={adsetId}
      onOpenPreview={onOpenPreview}
    />
  )
}

function SingleCreativeCard({
  ad,
  adsetId,
  onOpenPreview,
}: AdCreativeCardProps) {
  const [imgError, setImgError] = useState(false)

  const creative = ad.creative ?? {}
  const videoUrl = creative.video_url ?? undefined
  const thumb = creative.thumbnail_url ?? creative.image_url ?? undefined
  const showThumb = !!thumb && !imgError
  const typeKey = (creative.type ?? "").toString().toLowerCase()
  const isVideo = typeKey.includes("video") || !!videoUrl

  const emitSingle = (payload: {
    url: string
    kind: "image" | "video"
    title?: string
    alt?: string
  }) => onOpenPreview({ kind: "single", media: payload })

  const handleOpenMain = () => {
    if (videoUrl) {
      emitSingle({
        url: videoUrl,
        kind: "video",
        title: ad.name || ad.ad_id,
      })
      return
    }
    if (showThumb && thumb) {
      emitSingle({
        url: thumb,
        kind: "image",
        title: ad.name || ad.ad_id,
        alt: ad.name || ad.ad_id,
      })
    }
  }

  const clickableMain = !!videoUrl || showThumb

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-lg transition-shadow flex flex-col group">
      <div
        className={`relative bg-gray-900 overflow-hidden ${clickableMain ? "cursor-pointer" : ""}`}
        style={{ aspectRatio: "4/5", maxHeight: 360 }}
        onClick={clickableMain ? handleOpenMain : undefined}
      >
        {showThumb ? (
          <>
            <img
              src={thumb}
              alt={ad.name || ad.ad_id}
              className="w-full h-full object-contain bg-gray-900"
              loading="lazy"
              onError={() => setImgError(true)}
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Play className="w-7 h-7 text-white ml-1" fill="white" />
                </div>
              </div>
            )}
            {clickableMain && !isVideo && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="px-2 py-1 rounded-full bg-black/70 text-white text-[10px] flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Click para ampliar
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4 text-center">
            {isVideo ? (
              <Film className="w-9 h-9 text-gray-300" />
            ) : (
              <ImageIcon className="w-9 h-9 text-gray-300" />
            )}
            <span className="text-[11px] text-gray-400 leading-tight max-w-[140px]">
              {imgError
                ? "Vista previa no disponible"
                : isVideo
                  ? "Sin miniatura de video"
                  : "Sin imagen disponible"}
            </span>
            {videoUrl && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  emitSingle({
                    url: videoUrl,
                    kind: "video",
                    title: ad.name || ad.ad_id,
                  })
                }}
                className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Play className="w-3.5 h-3.5" /> Reproducir video
              </button>
            )}
          </div>
        )}

        {creative.type && creative.type !== "unknown" && (
          <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white capitalize">
            {creative.type}
          </span>
        )}

        {ad.status && ad.status !== "ACTIVE" && (
          <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-white">
            {ad.status}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <p
          className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2"
          title={ad.name}
        >
          {ad.name || ad.ad_id}
        </p>

        <div className="flex items-center gap-1 flex-wrap">
          <Badge variant="outline" className="text-[10px]">
            {ad.status || ad.effective_status || "—"}
          </Badge>
          <Badge variant="outline" className="text-[10px] text-gray-500">
            adset {adsetId.slice(-6)}
          </Badge>
        </div>

        {ad.metrics && (
          <div className="grid grid-cols-3 gap-x-3 gap-y-1 pt-2 border-t border-gray-100">
            {typeof ad.metrics.spend === "number" && (
              <Metric label="Gasto" value={`$${ad.metrics.spend.toFixed(2)}`} />
            )}
            {typeof ad.metrics.clicks === "number" && (
              <Metric label="Clics" value={ad.metrics.clicks.toLocaleString()} />
            )}
            {typeof ad.metrics.ctr === "number" && (
              <Metric label="CTR" value={`${(ad.metrics.ctr * 100).toFixed(2)}%`} />
            )}
            {typeof ad.metrics.impressions === "number" && (
              <Metric
                label="Impr."
                value={ad.metrics.impressions.toLocaleString()}
              />
            )}
            {typeof ad.metrics.conversions === "number" && (
              <Metric
                label="Conv."
                value={ad.metrics.conversions.toLocaleString()}
              />
            )}
            {typeof ad.metrics.roas === "number" && (
              <Metric label="ROAS" value={`${ad.metrics.roas.toFixed(2)}x`} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="text-xs font-semibold text-gray-700">{value}</p>
    </div>
  )
}
