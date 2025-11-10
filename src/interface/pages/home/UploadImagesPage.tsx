import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { X, Upload, Eye, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getImages, getUploadUrl, deleteImage } from "@/infrastructure/api/imagesRepository"

interface UploadedImage {
  name: string
  url: string
  path: string
}

export default function UploadImagesPage() {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const navigate = useNavigate()

  // 🔹 Obtener imágenes existentes al montar
  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      const res = await getImages()
      setImages(res)
    } catch (error) {
      console.error("Error al cargar imágenes:", error)
    }
  }

  // 🔹 Subir imágenes
  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return
    setIsLoading(true)

    try {
      await Promise.all(
        Array.from(files).map(async (file) => {
          const uploadData = await getUploadUrl(file.name)
          const uploadUrl = uploadData.uploadUrl

          await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          })
        })
      )

      await fetchImages()
    } catch (err) {
      console.error("Error subiendo imágenes:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // 🔹 Eliminar imagen
  const handleRemove = async (filename: string) => {
    try {
      setDeleting(filename)
      await deleteImage(filename)
      await fetchImages()
    } catch (err) {
      console.error("Error eliminando imagen:", err)
    } finally {
      setDeleting(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFileUpload(e.dataTransfer.files)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-100 text-gray-900">
      <main className="flex flex-col items-center grow px-6 py-10 text-center w-full">
        
        {/* 🔹 Botón Volver */}
        <div className="w-full max-w-6xl flex justify-start mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/home")}
            className="flex items-center gap-2"
          >
            ← Volver
          </Button>
        </div>

        <h2 className="text-4xl font-extrabold mb-3 text-blue-800 drop-shadow-sm">
          Sube tus <span className="text-blue-600">Imágenes</span>
        </h2>
        <p className="text-gray-600 mb-8">
          Arrastra y suelta tus archivos o selecciónalos desde tu dispositivo.
        </p>

        {/* 🔹 Zona de carga */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`w-full max-w-xl border-2 border-dashed rounded-2xl p-10 transition-all ${
            isDragging
              ? "border-blue-400 bg-blue-50/50"
              : "border-blue-200 bg-white hover:border-blue-300 hover:shadow-md"
          }`}
        >
          <input
            type="file"
            id="fileUpload"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <label
            htmlFor="fileUpload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
            ) : (
              <Upload className="w-12 h-12 text-blue-500 mb-3" />
            )}
            <span className="text-blue-700 font-medium">
              {isLoading
                ? "Subiendo imágenes..."
                : "Haz clic para seleccionar imágenes"}
            </span>
            <span className="text-gray-500 text-sm mt-1">
              o arrástralas aquí
            </span>
          </label>
        </div>

        {/* 🔹 Galería */}
        {images.length > 0 ? (
          <motion.div
            layout
            className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-7xl"
          >
            {images.map((image) => (
              <motion.div
                key={image.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="relative overflow-hidden border border-blue-100 hover:shadow-lg transition group">
                  <CardHeader className="p-0 relative">
                    <img
                      src={image.url}
                      alt={image.name}
                      onClick={() => setPreview(image.url)}
                      className="w-full h-52 object-cover cursor-pointer group-hover:opacity-90 transition"
                    />
                    <button
                      disabled={deleting === image.name}
                      onClick={() => handleRemove(image.name)}
                      className="absolute top-2 right-2 bg-white/80 hover:bg-red-100 text-red-600 rounded-full p-1 transition disabled:opacity-50"
                      title="Eliminar"
                    >
                      {deleting === image.name ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setPreview(image.url)}
                      className="absolute bottom-2 right-2 bg-white/80 hover:bg-blue-100 text-blue-600 rounded-full p-1 transition"
                      title="Ver imagen"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </CardHeader>
                  <CardContent className="p-3">
                    <p className="text-sm text-gray-700 truncate">{image.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <p className="text-gray-500 mt-8 text-sm">
            Aún no has subido imágenes.
          </p>
        )}

        {/* 🔹 Modal de preview */}
        <AnimatePresence>
          {preview && (
            <motion.div
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreview(null)}
            >
              <motion.div
                className="bg-white rounded-xl overflow-hidden shadow-2xl max-w-4xl w-full mx-6"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-end p-2">
                  <Button variant="ghost" onClick={() => setPreview(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-[70vh] object-contain"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
