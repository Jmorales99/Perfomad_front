import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Film,
  ImageIcon,
  Play,
} from "lucide-react"
import type {
  AdCreativeCard as Card,
  AdDetail,
} from "@/infrastructure/api/optimizationRepository"
import type { MediaItem, PreviewRequest } from "./MediaPreviewDialog"

interface CarouselCreativeCardProps {
  ad: AdDetail
  adsetId: string
  onOpenPreview: (request: PreviewRequest) => void
}

/**
 * Visual card for a carousel ad. Replaces the single-media slot of
 * `AdCreativeCard` with an in-card slider that exposes one card at a
 * time. Click anywhere on the slide opens `MediaPreviewDialog` in
 * gallery mode at the current index.
 *
 * Visual rules:
 * - Same outer shell, badges, and 3-column metric grid as
 *   `AdCreativeCard` so carousels and singles align in the grid.
 * - Slide media uses `object-contain` over a dark background so cards
 *   with non-1:1 aspect ratios are not cropped.
 * - Left/right arrows hidden when there is only one card.
 * - Dots row at the bottom; clicking a dot jumps to that slide
 *   without opening the preview.
 */
export default function CarouselCreativeCard({
  ad,
  adsetId,
  onOpenPreview,
}: CarouselCreativeCardProps) {
  const creative = ad.creative ?? {}
  const cards: Card[] = (creative.cards as Card[] | undefined) ?? []
  const total = cards.length
  const [index, setIndex] = useState(0)
  const [imgError, setImgError] = useState<Record<number, boolean>>({})

  if (total === 0) {
    return (
      <CardShell
        ad={ad}
        adsetId={adsetId}
        countLabel="carousel · 0"
        media={
          <EmptyMedia
            label="Carrusel sin tarjetas"
            icon={<ImageIcon className="w-9 h-9 text-gray-300" />}
          />
        }
      />
    )
  }

  const safeIndex = Math.min(index, total - 1)
  const current = cards[safeIndex]
  const currentThumb = current.image_url ?? current.thumbnail_url ?? null
  const currentVideo = current.video_url ?? null
  const currentIsVideo = !!currentVideo
  const showThumb = !!currentThumb && !imgError[safeIndex]

  const allItems: MediaItem[] = cards.map((c, i) => toMediaItem(c, i, total, ad))

  const openGalleryAt = (i: number) => {
    onOpenPreview({ kind: "gallery", items: allItems, initialIndex: i })
  }

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIndex((i) => (i - 1 + total) % total)
  }
  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIndex((i) => (i + 1) % total)
  }

  return (
    <CardShell
      ad={ad}
      adsetId={adsetId}
      countLabel={`carousel · ${total}`}
      media={
        <div
          className="relative w-full h-full cursor-pointer"
          onClick={() => openGalleryAt(safeIndex)}
        >
          {showThumb ? (
            <img
              src={currentThumb!}
              alt={current.name ?? `Card ${safeIndex + 1}`}
              className="w-full h-full object-contain bg-gray-900"
              loading="lazy"
              onError={() =>
                setImgError((prev) => ({ ...prev, [safeIndex]: true }))
              }
            />
          ) : (
            <EmptyMedia
              label={
                currentIsVideo
                  ? "Sin miniatura de video"
                  : "Sin imagen disponible"
              }
              icon={
                currentIsVideo ? (
                  <Film className="w-9 h-9 text-gray-300" />
                ) : (
                  <ImageIcon className="w-9 h-9 text-gray-300" />
                )
              }
            />
          )}

          {currentIsVideo && showThumb && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Play className="w-7 h-7 text-white ml-1" fill="white" />
              </div>
            </div>
          )}

          {!currentIsVideo && showThumb && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="px-2 py-1 rounded-full bg-black/70 text-white text-[10px] flex items-center gap-1">
                <Eye className="w-3 h-3" /> Click para ampliar
              </div>
            </div>
          )}

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Tarjeta anterior"
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/55 hover:bg-black/75 text-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Siguiente tarjeta"
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/55 hover:bg-black/75 text-white transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/70 text-white">
                {safeIndex + 1} / {total}
              </span>
            </>
          )}

          {/* Bottom title bar with name + dots */}
          <div className="absolute inset-x-0 bottom-0 px-2 pt-6 pb-1.5 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-1">
            {current.name && (
              <p className="text-[11px] text-white/90 truncate" title={current.name}>
                {current.name}
              </p>
            )}
            {total > 1 && total <= 8 && (
              <div className="flex items-center justify-center gap-1">
                {cards.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Ir a tarjeta ${i + 1}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setIndex(i)
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition ${
                      i === safeIndex ? "bg-white" : "bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      }
    />
  )
}

function toMediaItem(
  card: Card,
  i: number,
  total: number,
  ad: AdDetail
): MediaItem {
  const adName = ad.name || ad.ad_id
  const slideTitle = card.name
    ? `${adName} · ${card.name}`
    : `${adName} · ${i + 1}/${total}`
  if (card.video_url) {
    return { url: card.video_url, kind: "video", title: slideTitle }
  }
  const url = card.image_url ?? card.thumbnail_url ?? ""
  return {
    url,
    kind: "image",
    title: slideTitle,
    alt: card.name ?? `Card ${i + 1}`,
  }
}

/**
 * Outer shell shared with `AdCreativeCard` (badges, title, metric grid).
 * Kept inline here to avoid a circular import; the markup mirrors the
 * single-media card so both align visually in the grid.
 */
function CardShell({
  ad,
  adsetId,
  countLabel,
  media,
}: {
  ad: AdDetail
  adsetId: string
  countLabel: string
  media: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-lg transition-shadow flex flex-col group">
      <div
        className="relative bg-gray-900 overflow-hidden"
        style={{ aspectRatio: "4/5", maxHeight: 360 }}
      >
        {media}

        <span className="absolute top-2 left-2 z-10 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white">
          {countLabel}
        </span>
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

function EmptyMedia({
  label,
  icon,
}: {
  label: string
  icon: React.ReactNode
}) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4 text-center">
      {icon}
      <span className="text-[11px] text-gray-400 leading-tight max-w-[140px]">
        {label}
      </span>
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
