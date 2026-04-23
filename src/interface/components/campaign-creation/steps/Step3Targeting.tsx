import { Controller, useFormContext } from "react-hook-form"
import { Label } from "@/components/ui/label"
import type { CampaignFormValues } from "../schemas"

const COUNTRIES: Array<{ code: string; name: string }> = [
  { code: "CL", name: "Chile" },
  { code: "AR", name: "Argentina" },
  { code: "PE", name: "Perú" },
  { code: "CO", name: "Colombia" },
  { code: "MX", name: "México" },
  { code: "ES", name: "España" },
  { code: "US", name: "Estados Unidos" },
  { code: "BR", name: "Brasil" },
  { code: "UY", name: "Uruguay" },
  { code: "EC", name: "Ecuador" },
]

const GENDER_OPTIONS: Array<{ value: "male" | "female" | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "male", label: "Hombres" },
  { value: "female", label: "Mujeres" },
]

export default function Step3Targeting() {
  const { watch, setValue, control, formState } =
    useFormContext<CampaignFormValues>()
  const geoCountries = watch("geo_countries") ?? []
  const genders = watch("genders") ?? ["all"]
  const ageMin = watch("age_min")
  const ageMax = watch("age_max")

  const toggleCountry = (code: string) => {
    const next = geoCountries.includes(code)
      ? geoCountries.filter((c) => c !== code)
      : [...geoCountries, code]
    setValue("geo_countries", next, { shouldValidate: true })
  }

  const toggleGender = (g: "male" | "female" | "all") => {
    if (g === "all") {
      setValue("genders", ["all"])
      return
    }
    const withoutAll = genders.filter((x) => x !== "all")
    const next = withoutAll.includes(g)
      ? withoutAll.filter((x) => x !== g)
      : [...withoutAll, g]
    setValue("genders", next.length ? next : ["all"])
  }

  return (
    <div className="space-y-6">
      <div>
        <Label>Países</Label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {COUNTRIES.map((c) => {
            const selected = geoCountries.includes(c.code)
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => toggleCountry(c.code)}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${
                  selected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                {c.name}
              </button>
            )
          })}
        </div>
        {formState.errors.geo_countries && (
          <p className="text-xs text-red-600 mt-1">
            {formState.errors.geo_countries.message as string}
          </p>
        )}
      </div>

      <div>
        <Label>Edad</Label>
        <div className="flex items-center gap-3 mt-2">
          <Controller
            name="age_min"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                min={13}
                max={65}
                value={field.value}
                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 13)}
                className="w-20 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            )}
          />
          <span className="text-xs text-gray-500">a</span>
          <Controller
            name="age_max"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                min={13}
                max={65}
                value={field.value}
                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 65)}
                className="w-20 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            )}
          />
          <span className="text-xs text-gray-500">
            Rango actual: <strong>{ageMin}</strong>–<strong>{ageMax}</strong>
          </span>
        </div>
        {formState.errors.age_max && (
          <p className="text-xs text-red-600 mt-1">
            {formState.errors.age_max.message as string}
          </p>
        )}
      </div>

      <div>
        <Label>Género</Label>
        <div className="flex gap-2 mt-2">
          {GENDER_OPTIONS.map((g) => {
            const selected = genders.includes(g.value)
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => toggleGender(g.value)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  selected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                {g.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
        Segmentación simplificada. Intereses, audiencias custom y lookalikes se
        configuran en un paso avanzado posterior.
      </div>
    </div>
  )
}
