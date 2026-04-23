import { useCallback, useRef, useState } from "react"
import { UploadCloud, X, Image as ImageIcon, Video as VideoIcon, Loader2, AlertCircle } from "lucide-react"
import { getUploadUrl } from "@/infrastructure/api/imagesRepository"

export type MediaKind = "image" | "video"

export interface MediaItem {
  /** Storage path returned by the backend (what we pass to the API). */
  path: string
  /** Displayable signed URL (for preview). */
  previewUrl: string
  kind: MediaKind
  /** File size in bytes (used to show the user). */
  size: number
  /** Original filename before upload, for the list. */
  name: string
}

interface MediaUploaderProps {
  value: MediaItem[]
  onChange: (items: MediaItem[]) => void
  maxItems?: number
  /** Allow selecting multiple files at once. */
  multiple?: boolean
}

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"]
const VIDEO_MIME = ["video/mp4", "video/quicktime"]
const ALLOWED_MIME = [...IMAGE_MIME, ...VIDEO_MIME]

const MAX_IMAGE_BYTES = 30 * 1024 * 1024 // 30 MB (Meta limit is ~30 MB)
const MAX_VIDEO_BYTES = 1024 * 1024 * 1024 // 1 GB

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * Validates a single file and returns an error string or null.
 * We keep this client-side as a first line of defense; the backend re-validates
 * before forwarding to the platform API.
 */
function validateFile(file: File): string | null {
  if (!ALLOWED_MIME.includes(file.type)) {
    return `Formato no soportado: ${file.type || "desconocido"}. Usa JPG, PNG, WebP o MP4.`
  }
  const isImage = IMAGE_MIME.includes(file.type)
  const limit = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES
  if (file.size > limit) {
    return `Archivo muy grande (${formatSize(file.size)}). Máximo ${isImage ? "30 MB (imagen)" : "1 GB (video)"}.`
  }
  return null
}

export default function MediaUploader({
  value,
  onChange,
  maxItems = 10,
  multiple = true,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null)
      const fileArray = Array.from(files)
      if (value.length + fileArray.length > maxItems) {
        setError(`Máximo ${maxItems} archivos`)
        return
      }

      for (const f of fileArray) {
        const err = validateFile(f)
        if (err) {
          setError(err)
          return
        }
      }

      setUploading(true)
      try {
        const uploaded: MediaItem[] = []
        for (const file of fileArray) {
          const { uploadUrl, path } = await getUploadUrl(file.name)
          const putResp = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          })
          if (!putResp.ok) {
            throw new Error(`Upload falló: ${putResp.status}`)
          }
          const kind: MediaKind = IMAGE_MIME.includes(file.type)
            ? "image"
            : "video"
          uploaded.push({
            path,
            // Object URL is enough for preview; the persisted path on the
            // backend will be resolved to a signed URL when needed.
            previewUrl: URL.createObjectURL(file),
            kind,
            size: file.size,
            name: file.name,
          })
        }
        onChange([...value, ...uploaded])
      } catch (e) {
        setError((e as Error).message || "Error subiendo archivo")
      } finally {
        setUploading(false)
      }
    },
    [value, onChange, maxItems]
  )

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx))
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) {
      uploadFiles(e.dataTransfer.files)
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 py-8 px-6 rounded-xl border-2 border-dashed cursor-pointer transition ${
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-200 hover:border-gray-300 bg-gray-50"
        }`}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        ) : (
          <UploadCloud className="w-6 h-6 text-gray-400" />
        )}
        <div className="text-sm text-gray-700">
          <span className="font-medium text-blue-600">Haz clic para subir</span>{" "}
          o arrastra imágenes o videos aquí
        </div>
        <div className="text-xs text-gray-400">
          JPG, PNG, WebP · MP4, MOV (máx. imagen 30 MB · video 1 GB)
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_MIME.join(",")}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files)
            e.target.value = "" // allow re-selecting same file
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {value.map((m, idx) => (
            <div
              key={`${m.path}-${idx}`}
              className="relative group rounded-lg border border-gray-200 overflow-hidden bg-gray-50 aspect-square"
            >
              {m.kind === "image" ? (
                <img
                  src={m.previewUrl}
                  alt={m.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={m.previewUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1 flex items-center gap-1 text-[10px] text-white">
                {m.kind === "image" ? (
                  <ImageIcon className="w-3 h-3" />
                ) : (
                  <VideoIcon className="w-3 h-3" />
                )}
                <span className="truncate flex-1">{m.name}</span>
              </div>
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="absolute top-1 right-1 bg-white/90 hover:bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition"
                title="Quitar"
              >
                <X className="w-3 h-3 text-gray-700" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
