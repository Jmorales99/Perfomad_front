import { useCallback, useEffect, useState } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type MediaKind = "image" | "video"

export interface MediaItem {
  url: string
  kind: MediaKind
  alt?: string
  title?: string
}

/**
 * Discriminated union that callers (cards) emit when the user wants to
 * open the preview. The parent stores it as-is and forwards the right
 * props to `<MediaPreviewDialog>`.
 */
export type PreviewRequest =
  | { kind: "single"; media: MediaItem }
  | { kind: "gallery"; items: MediaItem[]; initialIndex: number }

interface MediaPreviewDialogProps {
  open: boolean
  /** Single media payload (back-compat). Ignored when `items` is provided. */
  media?: MediaItem | null
  /** Gallery payload. When provided with length > 1, gallery UI is shown. */
  items?: MediaItem[]
  /** Index to start at within `items` (defaults to 0). */
  initialIndex?: number
  onClose: () => void
}

/**
 * Standalone full-screen preview for ad creatives.
 *
 * Two modes:
 * - **Single**: pass `media={...}`. Behaves as a simple lightbox.
 * - **Gallery**: pass `items=[...]` (and optional `initialIndex`). Adds
 *   prev/next arrow controls, a slide counter and ArrowLeft/ArrowRight
 *   keyboard navigation. The `<MediaRenderer>` is keyed by URL so the
 *   `<video>` element is fully unmounted between slides — no stray audio
 *   continues playing after navigating away.
 *
 * Implementation notes:
 * - Uses Radix Dialog directly so we can override the project-wide
 *   `<Dialog>` styling (`max-w-lg`, padding, borders) and render
 *   true full-screen.
 * - Designed to be **nested** inside another Radix Dialog. Radix's
 *   `DismissableLayer` maintains a layer stack and only dispatches
 *   "outside click" / Escape to the topmost layer. The outer Dialog
 *   stays open while this preview is active — no `stopPropagation`
 *   or `preventDefault` hacks needed.
 * - Image rendering uses `max-width/height: 100%` with `width/height: auto`,
 *   so small images stay sharp at native size and large images cap to
 *   the viewport without distortion.
 * - Video uses native `<video controls>` so the browser owns the
 *   play/pause/seek/volume UI; we don't intercept its pointer events.
 */
export default function MediaPreviewDialog({
  open,
  media,
  items,
  initialIndex = 0,
  onClose,
}: MediaPreviewDialogProps) {
  const gallery = items && items.length > 0 ? items : null
  const isGallery = !!gallery && gallery.length > 1

  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Reset index whenever the gallery payload changes (e.g. opening a
  // different carousel) or the dialog re-opens.
  useEffect(() => {
    if (open) {
      setCurrentIndex(
        gallery
          ? Math.min(Math.max(0, initialIndex), gallery.length - 1)
          : 0
      )
    }
  }, [open, gallery, initialIndex])

  const currentItem = gallery
    ? gallery[Math.min(currentIndex, gallery.length - 1)]
    : (media ?? null)

  const goPrev = useCallback(() => {
    if (!gallery) return
    setCurrentIndex((i) => (i - 1 + gallery.length) % gallery.length)
  }, [gallery])

  const goNext = useCallback(() => {
    if (!gallery) return
    setCurrentIndex((i) => (i + 1) % gallery.length)
  }, [gallery])

  // Keyboard arrow navigation (only in gallery mode).
  useEffect(() => {
    if (!open || !isGallery) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        goPrev()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, isGallery, goPrev, goNext])

  return (
    <DialogPrimitive.Root
      open={open && !!currentItem}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[100] bg-black/95",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-0 z-[101] flex items-center justify-center",
            "outline-none focus:outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {currentItem?.title || currentItem?.alt || "Vista ampliada del creativo"}
          </DialogPrimitive.Title>

          <DialogPrimitive.Close
            className={cn(
              "absolute top-4 right-4 z-10 p-2 rounded-full",
              "bg-white/10 hover:bg-white/25 transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            )}
            aria-label="Cerrar vista ampliada"
          >
            <X className="w-6 h-6 text-white" />
          </DialogPrimitive.Close>

          {isGallery && (
            <>
              <span className="absolute top-5 left-1/2 -translate-x-1/2 text-xs text-white/70 px-2 py-1 rounded-full bg-white/10 select-none">
                {currentIndex + 1} / {gallery!.length}
              </span>

              <button
                type="button"
                onClick={goPrev}
                aria-label="Anterior"
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full",
                  "bg-white/10 hover:bg-white/25 transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                )}
              >
                <ChevronLeft className="w-7 h-7 text-white" />
              </button>

              <button
                type="button"
                onClick={goNext}
                aria-label="Siguiente"
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full",
                  "bg-white/10 hover:bg-white/25 transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                )}
              >
                <ChevronRight className="w-7 h-7 text-white" />
              </button>
            </>
          )}

          <div className="w-[92vw] h-[90vh] flex items-center justify-center p-4">
            {currentItem && <MediaRenderer media={currentItem} />}
          </div>

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/40 pointer-events-none">
            {currentItem?.title ? `${currentItem.title} · ` : ""}
            {isGallery ? "← → · " : ""}
            Esc · click fuera para cerrar
          </p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/**
 * Renders the actual media element. Keyed by `media.url` so the
 * `<video>` is fully unmounted when navigating between slides
 * (otherwise audio of the previous slide could keep playing).
 */
function MediaRenderer({ media }: { media: MediaItem }) {
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    setErrored(false)
  }, [media.url])

  if (errored) {
    return (
      <div className="text-white/60 text-sm">
        No se pudo cargar el contenido.
      </div>
    )
  }

  if (media.kind === "video") {
    return (
      <video
        key={media.url}
        src={media.url}
        controls
        autoPlay
        playsInline
        onError={() => setErrored(true)}
        className="rounded-xl shadow-2xl bg-black"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          width: "auto",
          height: "auto",
        }}
      />
    )
  }

  return (
    <img
      key={media.url}
      src={media.url}
      alt={media.alt ?? media.title ?? "Previsualización"}
      onError={() => setErrored(true)}
      className="rounded-xl shadow-2xl"
      style={{
        maxWidth: "100%",
        maxHeight: "100%",
        width: "auto",
        height: "auto",
        objectFit: "contain",
      }}
    />
  )
}
