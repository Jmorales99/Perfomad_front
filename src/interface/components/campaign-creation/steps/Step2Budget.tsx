import { Controller, useFormContext } from "react-hook-form"
import { AlertCircle, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NumberInput } from "../NumberInput"
import type { CampaignFormValues, CreationPlatform, PlatformBudgetEntry } from "../schemas"
import { BILLING_EVENTS } from "../schemas"

const BID_STRATEGIES = [
  { value: "LOWEST_COST_WITHOUT_CAP", label: "Costo más bajo (recomendado)" },
  { value: "LOWEST_COST_WITH_BID_CAP", label: "Costo más bajo con tope" },
  { value: "COST_CAP", label: "Tope de costo" },
  { value: "BID_CAP", label: "Tope de puja" },
] as const

const BILLING_LABELS: Record<(typeof BILLING_EVENTS)[number], string> = {
  IMPRESSIONS: "Impresiones",
  LINK_CLICKS: "Clics al enlace",
  POST_ENGAGEMENT: "Interacciones",
  VIDEO_VIEWS: "Vistas de video",
}

interface PlatformConfig {
  label: string
  brand: string
  icon: string
  accentClass: string
  borderClass: string
  note: string | null
}

const PLATFORM_CONFIG: Record<CreationPlatform, PlatformConfig> = {
  meta: {
    label: "Meta Ads",
    brand: "Facebook / Instagram",
    icon: "🔵",
    accentClass: "bg-blue-50/60",
    borderClass: "border-blue-200",
    note: null,
  },
  google_ads: {
    label: "Google Ads",
    brand: "Search / Display / YouTube",
    icon: "🟡",
    accentClass: "bg-amber-50/60",
    borderClass: "border-amber-200",
    note: "La creación automática de campañas en Google Ads está en implementación progresiva. El presupuesto queda registrado para cuando esté disponible.",
  },
}

interface PlatformBudgetCardProps {
  platform: CreationPlatform
  value: PlatformBudgetEntry
  onChange: (updates: Partial<PlatformBudgetEntry>) => void
  hasError: boolean
}

function PlatformBudgetCard({ platform, value, onChange, hasError }: PlatformBudgetCardProps) {
  const config = PLATFORM_CONFIG[platform]

  return (
    <div
      className={`rounded-xl border p-4 ${config.accentClass} ${
        hasError ? "border-red-300 ring-1 ring-red-200" : config.borderClass
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <div>
            <div className="text-sm font-semibold text-gray-900">{config.label}</div>
            <div className="text-xs text-gray-500">{config.brand}</div>
          </div>
        </div>
      </div>

      {/* Platform note */}
      {config.note && (
        <div className="flex items-start gap-2 mb-3 rounded-lg bg-amber-100/60 border border-amber-200 px-3 py-2">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">{config.note}</p>
        </div>
      )}

      {/* Budget type toggle */}
      <div className="mb-3">
        <Label className="text-xs text-gray-600 mb-1.5 block">Tipo de presupuesto</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ budget_type: "daily" })}
            className={`text-left rounded-lg border p-2.5 transition text-xs ${
              value.budget_type === "daily"
                ? "border-blue-500 ring-2 ring-blue-100 bg-white font-medium text-blue-700"
                : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
            }`}
          >
            <div className="font-medium">Diario</div>
            <div className="text-gray-400 font-normal mt-0.5">Gasto máximo por día</div>
          </button>
          <button
            type="button"
            onClick={() => onChange({ budget_type: "lifetime" })}
            className={`text-left rounded-lg border p-2.5 transition text-xs ${
              value.budget_type === "lifetime"
                ? "border-blue-500 ring-2 ring-blue-100 bg-white font-medium text-blue-700"
                : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
            }`}
          >
            <div className="font-medium">Total</div>
            <div className="text-gray-400 font-normal mt-0.5">Gasto en todo el período</div>
          </button>
        </div>
      </div>

      {/* Amount input */}
      <div>
        <Label className="text-xs text-gray-600 mb-1.5 block">
          {value.budget_type === "daily" ? "Monto diario (USD)" : "Monto total (USD)"}
        </Label>
        <NumberInput
          prefix="$"
          value={value.amount}
          onChange={(amount) => onChange({ amount })}
          min={1}
          placeholder={value.budget_type === "daily" ? "10.00" : "500.00"}
        />
        <p className="text-xs text-gray-400 mt-1">
          {value.budget_type === "daily"
            ? "Mínimo recomendado: $1.00 / día"
            : "Se distribuirá automáticamente en el período definido"}
        </p>
      </div>
    </div>
  )
}

export default function Step2Budget() {
  const { watch, setValue, control, register, formState } =
    useFormContext<CampaignFormValues>()

  const platforms = watch("platforms")
  const platformBudgets = watch("platform_budgets") ?? {}
  const endDate = watch("end_date")

  const getBudget = (platform: string): PlatformBudgetEntry => ({
    budget_type: platformBudgets[platform]?.budget_type ?? "daily",
    amount: platformBudgets[platform]?.amount ?? null,
  })

  const updateBudget = (platform: string, updates: Partial<PlatformBudgetEntry>) => {
    const current = getBudget(platform)
    setValue(
      "platform_budgets",
      { ...platformBudgets, [platform]: { ...current, ...updates } },
      { shouldValidate: true, shouldDirty: true }
    )
  }

  const hasLifetime = Object.values(platformBudgets).some(
    (pb) => pb?.budget_type === "lifetime"
  )

  // Total estimated spend across all platforms
  const totalSpend = Object.values(platformBudgets).reduce(
    (sum, pb) => sum + (pb?.amount ?? 0),
    0
  )
  const allDaily = Object.values(platformBudgets).every((pb) => pb?.budget_type === "daily")

  const platformBudgetsError = (formState.errors as any).platform_budgets?.message as string | undefined

  return (
    <div className="space-y-6">
      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Fecha de inicio</Label>
          <Input
            id="start_date"
            type="date"
            {...register("start_date")}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="end_date">
            Fecha de fin{" "}
            {hasLifetime && <span className="text-red-500">*</span>}
            {!hasLifetime && <span className="text-gray-400 text-xs">(opcional)</span>}
          </Label>
          <Input
            id="end_date"
            type="date"
            {...register("end_date")}
            className="mt-1"
          />
          {hasLifetime && !endDate && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Requerida cuando usas presupuesto total
            </p>
          )}
          {formState.errors.end_date && (
            <p className="text-xs text-red-600 mt-1">
              {formState.errors.end_date.message as string}
            </p>
          )}
        </div>
      </div>

      {/* Per-platform budget sections */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-semibold text-gray-900">
            Presupuesto por plataforma
          </Label>
          <span className="text-xs text-gray-400">
            Configura cuánto quieres invertir en cada plataforma
          </span>
        </div>

        <div className="space-y-3">
          {(platforms as CreationPlatform[]).map((platform) => (
            <PlatformBudgetCard
              key={platform}
              platform={platform}
              value={getBudget(platform)}
              onChange={(updates) => updateBudget(platform, updates)}
              hasError={!!platformBudgetsError && !getBudget(platform).amount}
            />
          ))}
        </div>

        {platformBudgetsError && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {platformBudgetsError}
          </p>
        )}
      </div>

      {/* Total summary */}
      {totalSpend > 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Inversión total estimada</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {platforms.length > 1
                  ? `Suma de todas las plataformas seleccionadas · ${allDaily ? "por día" : "mixto: diario + total"}`
                  : allDaily
                    ? "por día"
                    : "presupuesto total del período"}
              </p>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              ${totalSpend.toFixed(2)}
            </span>
          </div>
          {/* Per-platform breakdown (only when multiple platforms) */}
          {platforms.length > 1 && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
              {(platforms as CreationPlatform[]).map((p) => {
                const pb = getBudget(p)
                const cfg = PLATFORM_CONFIG[p]
                if (!pb.amount) return null
                return (
                  <div key={p} className="flex items-center justify-between text-xs text-gray-600">
                    <span>{cfg.icon} {cfg.label}</span>
                    <span>
                      ${(pb.amount ?? 0).toFixed(2)}{" "}
                      {pb.budget_type === "daily" ? "/ día" : "total"}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Bid strategy & billing event */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bid_strategy">Estrategia de puja</Label>
          <Controller
            name="bid_strategy"
            control={control}
            render={({ field }) => (
              <select
                id="bid_strategy"
                value={field.value}
                onChange={field.onChange}
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {BID_STRATEGIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="billing_event">Evento de facturación</Label>
          <Controller
            name="billing_event"
            control={control}
            render={({ field }) => (
              <select
                id="billing_event"
                value={field.value}
                onChange={field.onChange}
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {BILLING_EVENTS.map((b) => (
                  <option key={b} value={b}>
                    {BILLING_LABELS[b]}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
      </div>
    </div>
  )
}
