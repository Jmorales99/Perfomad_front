import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  type CampaignDTO,
  type Platform,
} from "@/infrastructure/api/campaignsRepository"
import { getImages, getUploadUrl } from "@/infrastructure/api/imagesRepository"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button" // 👈 asegúrate que el archivo se llame exactamente "button.tsx"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2, Rocket, Upload, X } from "lucide-react"
import axios from "axios"

interface ImageItem {
  name: string
  url: string
  path: string 
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CampaignDTO | null>(null)
  const [allImages, setAllImages] = useState<ImageItem[]>([])
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null)
  const [form, setForm] = useState<{
    name: string
    platforms: Platform[]
    description: string
    budget_usd: number
    images: ImageItem[]
  }>({
    name: "",
    platforms: ["meta"],
    description: "",
    budget_usd: 0,
    images: [],
  })

  const navigate = useNavigate()

  // ===========================
  // Fetch campañas e imágenes
  // ===========================
  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const data = await getCampaigns()
      setCampaigns(data)
    } catch (e) {
      console.error("Error al cargar campañas:", e)
    } finally {
      setLoading(false)
    }
  }

  const fetchImages = async () => {
    try {
      const imgs = await getImages()
      setAllImages(imgs)
    } catch (e) {
      console.error("Error al cargar imágenes:", e)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    if (showModal) fetchImages()
  }, [showModal])

  // ===========================
  // Subida de imagen
  // ===========================
  const handleUploadImage = async (file: File) => {
    try {
      const { uploadUrl } = await getUploadUrl(file.name)
      await axios.put(uploadUrl, file, { headers: { "Content-Type": file.type } })
      await fetchImages()
    } catch (err) {
      console.error("Error subiendo imagen:", err)
    }
  }

  // ===========================
  // Guardar campaña
  // ===========================
  const handleSave = async () => {
    if (form.platforms.length === 0) {
      alert("Debes seleccionar al menos una plataforma.")
      return
    }

    try {
      const payload = {
        ...form,
        images: form.images
          .filter((i) => i.path)
          .map((i) => ({ path: i.path! })),
      }

      if (editing) await updateCampaign(editing.id, payload)
      else await createCampaign(payload)

      setShowModal(false)
      setEditing(null)
      await fetchCampaigns()
    } catch (e) {
      console.error("Error al guardar campaña:", e)
    }
  }

  // ===========================
  // Eliminar campaña
  // ===========================
  const handleDelete = async (id: string) => {
    if (confirm("¿Seguro que deseas eliminar esta campaña?")) {
      await deleteCampaign(id)
      fetchCampaigns()
    }
  }

  // ===========================
  // UI Data
  // ===========================
  const platformLabels: Record<Platform, string> = {
    meta: "Meta",
    google_ads: "Google Ads",
    linkedin: "LinkedIn",
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    completed: "bg-gray-100 text-gray-700",
  }

  // ===========================
  // Render
  // ===========================
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate("/home")}>
          ← Volver
        </Button>
        <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700">
          Nueva campaña
        </Button>
      </div>

      <h1 className="text-3xl font-bold text-blue-700">Tus campañas</h1>

      {loading ? (
        <p className="text-center text-gray-500 py-10">Cargando campañas...</p>
      ) : campaigns.length === 0 ? (
        <Card className="border-blue-100 text-center p-8">
          <p className="text-gray-600 mb-4">Aún no tienes campañas creadas.</p>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowModal(true)}>
            Crear campaña
          </Button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((c) => (
            <Card key={c.id} className="border border-blue-100 shadow-sm hover:shadow-md transition">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {c.number ? `Campaña #${c.number} — ${c.name}` : c.name}
                    </h3>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge className={statusColors[c.status] || "bg-gray-100 text-gray-700"}>
                        {c.status === "active"
                          ? "Activa"
                          : c.status === "paused"
                          ? "Pausada"
                          : "Completada"}
                      </Badge>
                      {(Array.isArray(c.platforms) ? c.platforms : [c.platforms ?? "meta"]).map(
                        (p) => (
                          <Badge key={p} variant="outline" className="text-xs">
                            {platformLabels[p as Platform]}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {c.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">{c.description}</p>
                )}
                <div className="flex justify-between text-sm text-gray-700 mb-4">
                  <div>
                    <span className="block text-gray-500 text-xs">Presupuesto</span>
                    <strong>${c.budget_usd.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-xs">Gastado</span>
                    <strong>${c.spend_usd?.toLocaleString() ?? 0}</strong>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 flex items-center gap-2"
                    onClick={() => navigate(`/optimize/${c.id}`)}
                  >
                    <Rocket className="w-4 h-4" /> Optimizar
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-50 p-2"
                      onClick={() => {
                        setEditing(c)
                        setForm({
                            name: c.name,
                            platforms: Array.isArray(c.platforms) ? c.platforms : [c.platforms],
                            description: c.description ?? "",
                            budget_usd: c.budget_usd,
                            images: (c.images || []).map((img) => ({
                                name: (img.path ?? "").split("/").pop() || "imagen",
                                url: img.signed_url ?? "",
                                path: img.path ?? "",
                                })),
                        })
                        setShowModal(true)
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" className="p-2" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal creación/edición */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-blue-700">
              {editing ? "Editar campaña" : "Nueva campaña"}
            </DialogTitle>
          </DialogHeader>

          <form
            className="space-y-6 p-1"
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
          >
            <div>
              <Label>Nombre</Label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <Label>Plataformas</Label>
              <div className="flex flex-col gap-3 mt-1">
                {(["meta", "google_ads", "linkedin"] as Platform[]).map((p) => (
                  <div key={p} className="flex items-center justify-between border p-2 rounded-lg">
                    <Label>{p === "meta" ? "Meta" : p === "google_ads" ? "Google Ads" : "LinkedIn"}</Label>
                    <Switch
                      checked={form.platforms.includes(p)}
                      onCheckedChange={(v) => {
                        let updated = form.platforms
                        if (v) updated = [...form.platforms, p]
                        else updated = form.platforms.filter((x) => x !== p)
                        if (updated.length === 0) return
                        setForm({ ...form, platforms: updated })
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Descripción</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-lg p-2 h-24 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label>Presupuesto (USD)</Label>
              <input
                type="number"
                value={form.budget_usd}
                onChange={(e) => setForm({ ...form, budget_usd: Number(e.target.value) || 0 })}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Galería */}
            <div>
              <Label>Imágenes</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {allImages.map((img) => {
                  const selected = form.images.some((i) => i.path === img.path)
                  return (
                    <div
                      key={img.url}
                      onClick={() => {
                        if (selected)
                          setForm({
                            ...form,
                            images: form.images.filter((i) => i.url !== img.url),
                          })
                        else setForm({ ...form, images: [...form.images, img] })
                      }}
                      onDoubleClick={() => setPreviewImage(img)}
                      className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all hover:scale-105 ${
                        selected ? "border-blue-600 ring-2 ring-blue-400" : "border-gray-200"
                      }`}
                    >
                      <img src={img.url} alt={img.name} className="w-20 h-20 object-cover rounded-md" />
                      {selected && (
                        <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-1 shadow-md">
                          ✓
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-3 flex gap-3">
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                  onClick={() => document.getElementById("uploadInput")?.click()}
                >
                  <Upload className="w-4 h-4" /> Subir nueva imagen
                </Button>

                <input
                  id="uploadInput"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUploadImage(file)
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Guardar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-8 -right-8 text-white"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="max-h-[80vh] max-w-full rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
