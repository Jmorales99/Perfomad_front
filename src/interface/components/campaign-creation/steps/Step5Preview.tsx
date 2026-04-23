import { useFormContext } from "react-hook-form"
import { Card, CardContent } from "@/components/ui/card"
import type { CampaignFormValues, CreationPlatform } from "../schemas"
import { META_OBJECTIVE_LABELS, CTA_LABELS } from "../schemas"

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right break-all">{value}</span>
    </div>
  )
}

const PLATFORM_LABELS: Record<CreationPlatform, string> = {
  meta: "Meta Ads",
  google_ads: "Google Ads",
}

export default function Step5Preview() {
  const { watch } = useFormContext<CampaignFormValues>()
  const v = watch()
  const firstMedia = v.media?.[0]

  // Build budget summary
  const platformBudgets = v.platform_budgets ?? {}
  const validPlatformBudgets = Object.entries(platformBudgets).filter(
    ([, pb]) => pb?.amount != null && pb.amount > 0
  )
  const totalSpend = validPlatformBudgets.reduce((s, [, pb]) => s + (pb?.amount ?? 0), 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Resumen */}
      <Card>
        <CardContent className="p-5 divide-y divide-gray-100">
          <div className="pb-3">
            <h3 className="text-sm font-semibold text-gray-900">Resumen</h3>
            <p className="text-xs text-gray-500">
              Revisa los datos antes de crear la campaña. Todo se creará en estado{" "}
              <strong>pausado</strong> para que puedas verificarlo en cada plataforma.
            </p>
          </div>
          <div className="pt-2">
            <Row label="Nombre" value={v.name || "—"} />
            <Row label="Plataformas" value={v.platforms.join(", ")} />
            <Row label="Objetivo" value={META_OBJECTIVE_LABELS[v.objective]} />

            {/* Budget breakdown per platform */}
            {validPlatformBudgets.length > 0 ? (
              <>
                {validPlatformBudgets.map(([platform, pb]) => (
                  <Row
                    key={platform}
                    label={PLATFORM_LABELS[platform as CreationPlatform] ?? platform}
                    value={
                      pb!.budget_type === "daily"
                        ? `$${(pb!.amount ?? 0).toFixed(2)} / día`
                        : `$${(pb!.amount ?? 0).toFixed(2)} total`
                    }
                  />
                ))}
                {validPlatformBudgets.length > 1 && (
                  <div className="flex items-start justify-between gap-4 py-1.5 text-sm border-t border-dashed border-gray-200 mt-1 pt-2">
                    <span className="text-gray-700 font-medium">Total estimado</span>
                    <span className="text-gray-900 font-bold">
                      ${totalSpend.toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <Row label="Presupuesto" value="—" />
            )}

            <Row
              label="Fechas"
              value={
                v.start_date
                  ? `${v.start_date}${v.end_date ? ` → ${v.end_date}` : ""}`
                  : "Inicio inmediato"
              }
            />
            <Row
              label="Segmentación"
              value={
                <span className="text-xs">
                  {v.geo_countries.join(", ")} · {v.age_min}–{v.age_max} ·{" "}
                  {v.genders?.join(", ") ?? "todos"}
                </span>
              }
            />
            <Row label="CTA" value={CTA_LABELS[v.cta]} />
            <Row
              label="Destino"
              value={
                <span className="text-xs text-blue-600 underline">{v.link}</span>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview visual */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Vista previa</h3>
            <span className="text-[10px] text-gray-400">
              Aproximación — Meta genera la versión final
            </span>
          </div>
          <div className="pt-3">
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white max-w-sm mx-auto">
              {/* Fake page header */}
              <div className="flex items-center gap-2 p-2 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                <div className="flex-1 text-xs">
                  <div className="font-medium text-gray-900">{v.name || "Tu página"}</div>
                  <div className="text-gray-400">Publicación · Promocionado</div>
                </div>
              </div>
              {/* Primary text */}
              {v.primary_text && (
                <p className="text-sm px-3 py-2 text-gray-800 whitespace-pre-wrap">
                  {v.primary_text}
                </p>
              )}
              {/* Media */}
              <div className="bg-gray-100 aspect-[4/5] flex items-center justify-center">
                {firstMedia ? (
                  firstMedia.kind === "image" ? (
                    <img
                      src={firstMedia.previewUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={firstMedia.previewUrl}
                      className="w-full h-full object-cover"
                      controls
                    />
                  )
                ) : (
                  <span className="text-xs text-gray-400">Sin material creativo</span>
                )}
              </div>
              {/* Headline + CTA */}
              <div className="flex items-center justify-between gap-3 p-3 bg-gray-50">
                <div className="min-w-0">
                  <div className="text-xs text-gray-400 uppercase">Sitio</div>
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {v.headline || "Tu título"}
                  </div>
                  {v.description && (
                    <div className="text-xs text-gray-500 truncate">{v.description}</div>
                  )}
                </div>
                <button
                  type="button"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 whitespace-nowrap"
                >
                  {CTA_LABELS[v.cta]}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
