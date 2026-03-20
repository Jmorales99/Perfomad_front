import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useClient } from "@/app/providers/ClientProvider"
import { ApiError } from "@/infrastructure/api/errors"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import type { Client } from "@/infrastructure/repositories/clientsRepository"

// ── Fila de cada marca ──────────────────────────────────────────────────────────
function BrandRow({
  client,
  isActive,
  isOnly,
  onSelect,
  onDelete,
  deleting,
}: {
  client: Client
  isActive: boolean
  isOnly: boolean
  onSelect: () => void
  onDelete: () => void
  deleting: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
        isActive
          ? "border-blue-300 bg-blue-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {/* Icono + info */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            isActive ? "bg-blue-100" : "bg-gray-100"
          }`}
        >
          <Building2
            className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-500"}`}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 truncate">{client.name}</p>
            {isActive && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                Activa
              </span>
            )}
          </div>
          {client.description && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{client.description}</p>
          )}
          {client.created_at && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              Creada {new Date(client.created_at).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 shrink-0">
        {!isActive && (
          <Button variant="outline" size="sm" onClick={onSelect} className="text-blue-700 border-blue-200 hover:bg-blue-50">
            Seleccionar
          </Button>
        )}
        <button
          onClick={onDelete}
          disabled={isOnly || deleting}
          title={isOnly ? "No puedes eliminar la única marca" : "Eliminar marca"}
          className={`p-2 rounded-lg transition-colors ${
            isOnly || deleting
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-400 hover:text-red-600 hover:bg-red-50"
          }`}
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}

// ── Formulario nuevo ────────────────────────────────────────────────────────────
function NewBrandForm({
  onSubmit,
  onCancel,
  loading,
}: {
  onSubmit: (name: string, description: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(trimmed, description.trim())
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-blue-200 bg-blue-50/50 rounded-xl p-4 space-y-3"
    >
      <p className="text-sm font-semibold text-blue-800">Nueva marca</p>
      <div>
        <Label htmlFor="brand-name" className="text-xs text-gray-600">
          Nombre <span className="text-red-500">*</span>
        </Label>
        <Input
          id="brand-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Mi Empresa SRL"
          className="mt-1"
          autoFocus
          required
        />
      </div>
      <div>
        <Label htmlFor="brand-desc" className="text-xs text-gray-600">
          Descripción (opcional)
        </Label>
        <Input
          id="brand-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Breve descripción"
          className="mt-1"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={loading || !name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
          Crear marca
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

// ── Página principal ────────────────────────────────────────────────────────────
export default function BrandsPage() {
  const navigate = useNavigate()
  const {
    clients,
    selectedClientId,
    loadingClients,
    setSelectedClientId,
    createAndSelectClient,
    removeClient,
  } = useClient()

  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleCreate = async (name: string, description: string) => {
    setCreating(true)
    setErrorMsg(null)
    try {
      await createAndSelectClient(name, description || undefined)
      setShowForm(false)
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.serverMessage || err.message)
      } else {
        setErrorMsg("Error al crear la marca.")
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (clients.length <= 1) return
    setDeletingId(id)
    setErrorMsg(null)
    try {
      await removeClient(id)
    } catch (err) {
      if (err instanceof ApiError && err.code === "last_brand_forbidden") {
        setErrorMsg("No puedes eliminar la última marca. Crea otra antes de borrar esta.")
      } else if (err instanceof ApiError) {
        setErrorMsg(err.serverMessage || err.message)
      } else {
        setErrorMsg("Error al eliminar la marca.")
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/home")}
          className="border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marcas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestiona las marcas con las que operas en Perfomad.
          </p>
        </div>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="flex-1">{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-600 underline text-xs shrink-0 mt-0.5"
          >
            Cerrar
          </button>
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Tus marcas</h2>
            {selectedClientId && (
              <p className="text-xs text-gray-500 mt-0.5">
                Marca activa:{" "}
                <span className="font-medium text-blue-700">
                  {clients.find((c) => c.id === selectedClientId)?.name ?? "—"}
                </span>
              </p>
            )}
          </div>
          {!showForm && (
            <Button
              size="sm"
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nueva marca
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Formulario de creación */}
          {showForm && (
            <NewBrandForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              loading={creating}
            />
          )}

          {/* Lista */}
          {loadingClients ? (
            <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando marcas...</span>
            </div>
          ) : clients.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              No hay marcas. Crea la primera.
            </p>
          ) : (
            clients.map((client) => (
              <BrandRow
                key={client.id}
                client={client}
                isActive={client.id === selectedClientId}
                isOnly={clients.length <= 1}
                onSelect={() => setSelectedClientId(client.id)}
                onDelete={() => handleDelete(client.id)}
                deleting={deletingId === client.id}
              />
            ))
          )}

          {/* Nota de protección */}
          {clients.length <= 1 && !loadingClients && (
            <p className="text-xs text-gray-400 text-center pt-1">
              Necesitas al menos una marca. Crea otra antes de eliminar esta.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Guía rápida */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <p className="font-medium mb-1">¿Para qué sirven las marcas?</p>
        <p className="text-blue-700 text-xs leading-relaxed">
          Cada marca agrupa las cuentas publicitarias (Meta, Google Ads, etc.) que le corresponden.
          Al conectar Meta, los tokens se guardan por marca — así puedes gestionar varios clientes
          desde una sola cuenta Perfomad.
        </p>
      </div>
    </div>
  )
}
