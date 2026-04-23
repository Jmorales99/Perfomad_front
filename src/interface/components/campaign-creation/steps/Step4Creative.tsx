import { Controller, useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import MediaUploader from "../MediaUploader"
import type { CampaignFormValues } from "../schemas"
import { CTA_OPTIONS, CTA_LABELS } from "../schemas"

export default function Step4Creative() {
  const { register, control, watch, formState } =
    useFormContext<CampaignFormValues>()
  const headline = watch("headline") ?? ""
  const primaryText = watch("primary_text") ?? ""
  const description = watch("description") ?? ""

  return (
    <div className="space-y-6">
      <div>
        <Label>Material creativo</Label>
        <p className="text-xs text-gray-500 mb-2">
          Sube imágenes (JPG/PNG/WebP) o videos (MP4/MOV). Podrás ver un preview
          real antes de publicar.
        </p>
        <Controller
          name="media"
          control={control}
          render={({ field }) => (
            <MediaUploader value={field.value} onChange={field.onChange} maxItems={10} />
          )}
        />
        {formState.errors.media && (
          <p className="text-xs text-red-600 mt-1">
            {formState.errors.media.message as string}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="headline">
          Título <span className="text-gray-400">({headline.length}/40)</span>
        </Label>
        <Input
          id="headline"
          {...register("headline")}
          maxLength={40}
          placeholder="Ej. Envío gratis hoy"
          className="mt-1"
        />
        {formState.errors.headline && (
          <p className="text-xs text-red-600 mt-1">{formState.errors.headline.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="primary_text">
          Texto principal <span className="text-gray-400">({primaryText.length}/125)</span>
        </Label>
        <textarea
          id="primary_text"
          {...register("primary_text")}
          maxLength={125}
          rows={3}
          placeholder="El copy principal que verá el usuario antes de la imagen."
          className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
        />
        {formState.errors.primary_text && (
          <p className="text-xs text-red-600 mt-1">
            {formState.errors.primary_text.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description">
          Descripción opcional <span className="text-gray-400">({description.length}/30)</span>
        </Label>
        <Input
          id="description"
          {...register("description")}
          maxLength={30}
          placeholder="Ej. Oferta por tiempo limitado"
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cta">Botón de acción</Label>
          <Controller
            name="cta"
            control={control}
            render={({ field }) => (
              <select
                id="cta"
                value={field.value}
                onChange={field.onChange}
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {CTA_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {CTA_LABELS[c]}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="link">URL de destino</Label>
          <Input
            id="link"
            type="url"
            {...register("link")}
            placeholder="https://…"
            className="mt-1"
          />
          {formState.errors.link && (
            <p className="text-xs text-red-600 mt-1">{formState.errors.link.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
