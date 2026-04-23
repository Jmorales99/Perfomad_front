import { z } from "zod"

/**
 * Zod schemas for the campaign-creation wizard.
 *
 * The backend has its own canonical schema at
 * `src/application/schemas/CreateCampaignSchema.ts`. This frontend schema is
 * tighter (enforces targeting/creative mandatory when relevant) and
 * serializes to the shape that controller accepts.
 */

export const PLATFORM = ["meta", "google_ads", "linkedin", "tiktok"] as const
export type Platform = typeof PLATFORM[number]

/** Platforms that the backend supports for creation today (Phase A + B). */
export const CREATION_PLATFORMS = ["meta", "google_ads"] as const
export type CreationPlatform = typeof CREATION_PLATFORMS[number]

export const META_OBJECTIVES = [
  "OUTCOME_TRAFFIC",
  "OUTCOME_SALES",
  "OUTCOME_ENGAGEMENT",
  "OUTCOME_LEADS",
  "OUTCOME_AWARENESS",
  "OUTCOME_APP_PROMOTION",
] as const

export const META_OBJECTIVE_LABELS: Record<typeof META_OBJECTIVES[number], string> = {
  OUTCOME_TRAFFIC: "Tráfico al sitio",
  OUTCOME_SALES: "Ventas / conversiones",
  OUTCOME_ENGAGEMENT: "Interacciones",
  OUTCOME_LEADS: "Captación de leads",
  OUTCOME_AWARENESS: "Reconocimiento de marca",
  OUTCOME_APP_PROMOTION: "Instalaciones de app",
}

export const BILLING_EVENTS = [
  "IMPRESSIONS",
  "LINK_CLICKS",
  "POST_ENGAGEMENT",
  "VIDEO_VIEWS",
] as const

export const CTA_OPTIONS = [
  "LEARN_MORE",
  "SHOP_NOW",
  "SIGN_UP",
  "DOWNLOAD",
  "BOOK_NOW",
  "CONTACT_US",
  "APPLY_NOW",
  "GET_OFFER",
  "SUBSCRIBE",
] as const

export const CTA_LABELS: Record<typeof CTA_OPTIONS[number], string> = {
  LEARN_MORE: "Más información",
  SHOP_NOW: "Comprar ahora",
  SIGN_UP: "Registrarse",
  DOWNLOAD: "Descargar",
  BOOK_NOW: "Reservar",
  CONTACT_US: "Contactar",
  APPLY_NOW: "Postular",
  GET_OFFER: "Obtener oferta",
  SUBSCRIBE: "Suscribirse",
}

// ───────────────────────────────────────────────────────────────────
// Step schemas (each returned by useForm for its own step)
// ───────────────────────────────────────────────────────────────────

export const step1Schema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(200),
  platforms: z
    .array(z.enum(CREATION_PLATFORMS))
    .min(1, "Selecciona al menos una plataforma"),
  client_id: z.string().uuid().optional(),
  /**
   * Map of platform → ad account id the user picked. Partial because only the
   * selected platforms have an entry, and platforms with a single account
   * auto-select without requiring user input.
   */
  ad_account_ids: z
    .record(z.string(), z.string())
    .optional(),
  objective: z.enum(META_OBJECTIVES).default("OUTCOME_TRAFFIC"),
  meta_page_id: z.string().optional(),
})

const platformBudgetEntrySchema = z.object({
  budget_type: z.enum(["daily", "lifetime"]),
  amount: z.number().positive().nullable(),
})

export const step2Schema = z
  .object({
    // Legacy fields kept in schema to avoid type errors in existing code.
    // New UI does not set these — budget is fully managed via platform_budgets.
    budget_mode: z.enum(["daily", "lifetime"]).default("daily"),
    budget_usd: z.number().positive().nullable(),
    lifetime_budget: z.number().positive().nullable(),
    // Per-platform budget configuration (new model)
    platform_budgets: z.record(z.string(), platformBudgetEntrySchema).optional(),
    start_date: z.string().optional(),
    end_date: z.string().nullable().optional(),
    bid_strategy: z.enum([
      "LOWEST_COST_WITHOUT_CAP",
      "LOWEST_COST_WITH_BID_CAP",
      "COST_CAP",
      "BID_CAP",
    ]).default("LOWEST_COST_WITHOUT_CAP"),
    billing_event: z.enum(BILLING_EVENTS).default("IMPRESSIONS"),
  })
  .refine(
    (d) => {
      const entries = Object.values(d.platform_budgets ?? {})
      return entries.some((pb) => pb?.amount != null && pb.amount > 0)
    },
    { message: "Ingresa el presupuesto para al menos una plataforma", path: ["platform_budgets"] }
  )
  .refine(
    (d) => {
      const hasLifetime = Object.values(d.platform_budgets ?? {}).some(
        (pb) => pb?.budget_type === "lifetime"
      )
      return !hasLifetime || !!d.end_date
    },
    { message: "La fecha de fin es requerida cuando usas presupuesto total", path: ["end_date"] }
  )
  .refine(
    (d) =>
      !d.start_date ||
      !d.end_date ||
      new Date(d.end_date) > new Date(d.start_date),
    { message: "La fecha de fin debe ser posterior a la de inicio", path: ["end_date"] }
  )

export const step3Schema = z.object({
  geo_countries: z.array(z.string().length(2)).min(1, "Selecciona al menos un país"),
  age_min: z.number().int().min(13).max(65),
  age_max: z.number().int().min(13).max(65),
  genders: z.array(z.enum(["male", "female", "all"])).optional(),
}).refine((d) => d.age_min <= d.age_max, {
  message: "La edad mínima no puede ser mayor que la máxima",
  path: ["age_max"],
})

export const step4Schema = z.object({
  media: z.array(z.object({
    path: z.string(),
    previewUrl: z.string(),
    kind: z.enum(["image", "video"]),
    size: z.number(),
    name: z.string(),
  })).min(1, "Sube al menos una imagen o video").max(10),
  headline: z.string().trim().min(1, "Título requerido").max(40, "Máximo 40 caracteres"),
  primary_text: z.string().trim().min(1, "Texto principal requerido").max(125, "Máximo 125 caracteres"),
  description: z.string().max(30, "Máximo 30 caracteres").optional(),
  cta: z.enum(CTA_OPTIONS).default("LEARN_MORE"),
  link: z.string().url("Ingresa una URL válida (ej. https://...)"),
})

// ───────────────────────────────────────────────────────────────────
// Full form schema — accumulates every step
// ───────────────────────────────────────────────────────────────────

export const fullCampaignSchema = z.object({
  name: z.string().trim().min(1).max(200),
  platforms: z.array(z.enum(CREATION_PLATFORMS)).min(1),
  client_id: z.string().uuid().optional(),
  ad_account_ids: z.record(z.string(), z.string()).optional(),
  objective: z.enum(META_OBJECTIVES).default("OUTCOME_TRAFFIC"),
  meta_page_id: z.string().optional(),
  // Legacy budget fields (kept for backward compat, not set by new UI)
  budget_mode: z.enum(["daily", "lifetime"]).default("daily"),
  budget_usd: z.number().positive().nullable(),
  lifetime_budget: z.number().positive().nullable(),
  // Per-platform budgets (new model)
  platform_budgets: z.record(z.string(), platformBudgetEntrySchema).optional(),
  start_date: z.string().optional(),
  end_date: z.string().nullable().optional(),
  bid_strategy: z.enum([
    "LOWEST_COST_WITHOUT_CAP",
    "LOWEST_COST_WITH_BID_CAP",
    "COST_CAP",
    "BID_CAP",
  ]).default("LOWEST_COST_WITHOUT_CAP"),
  billing_event: z.enum(BILLING_EVENTS).default("IMPRESSIONS"),
  // Step 3 inline
  geo_countries: z.array(z.string().length(2)),
  age_min: z.number().int().min(13).max(65),
  age_max: z.number().int().min(13).max(65),
  genders: z.array(z.enum(["male", "female", "all"])).optional(),
  // Step 4 inline
  media: z.array(z.object({
    path: z.string(),
    previewUrl: z.string(),
    kind: z.enum(["image", "video"]),
    size: z.number(),
    name: z.string(),
  })),
  headline: z.string().max(40),
  primary_text: z.string().max(125),
  description: z.string().max(30).optional(),
  cta: z.enum(CTA_OPTIONS),
  link: z.string().url(),
})

export type CampaignFormValues = z.infer<typeof fullCampaignSchema>
export type Step1Values = z.infer<typeof step1Schema>
export type Step2Values = z.infer<typeof step2Schema>
export type Step3Values = z.infer<typeof step3Schema>
export type Step4Values = z.infer<typeof step4Schema>
export type PlatformBudgetEntry = z.infer<typeof platformBudgetEntrySchema>

export const DEFAULT_CAMPAIGN_FORM: CampaignFormValues = {
  name: "",
  platforms: ["meta"],
  client_id: undefined,
  ad_account_ids: {},
  objective: "OUTCOME_TRAFFIC",
  meta_page_id: undefined,
  // Legacy (not used by new UI)
  budget_mode: "daily",
  budget_usd: null,
  lifetime_budget: null,
  // Per-platform budgets
  platform_budgets: {},
  start_date: undefined,
  end_date: undefined,
  bid_strategy: "LOWEST_COST_WITHOUT_CAP",
  billing_event: "IMPRESSIONS",
  geo_countries: ["CL"],
  age_min: 18,
  age_max: 65,
  genders: ["all"],
  media: [],
  headline: "",
  primary_text: "",
  description: undefined,
  cta: "LEARN_MORE",
  link: "",
}

// ───────────────────────────────────────────────────────────────────
// Serializer: converts the wizard form values → CreateCampaignPayload
// that the backend's createCampaignSchema accepts.
// ───────────────────────────────────────────────────────────────────

export function serializeForBackend(v: CampaignFormValues) {
  const payload: Record<string, unknown> = {
    name: v.name,
    platforms: v.platforms,
    client_id: v.client_id,
    objective: v.objective,
    billing_event: v.billing_event,
    bid_strategy: v.bid_strategy,
    start_date: v.start_date,
    end_date: v.end_date,
    meta_settings: v.meta_page_id ? { page_id: v.meta_page_id } : undefined,
    targeting: {
      geo_countries: v.geo_countries,
      age_min: v.age_min,
      age_max: v.age_max,
      genders: v.genders,
    },
    creative: v.media.length > 0 ? {
      // pageId is required for Meta to build the full ad hierarchy
      page_id: v.meta_page_id || undefined,
      // Use the first media item's Supabase Storage path as the mediaUrl
      media_url: v.media[0]?.path,
      media_type: v.media[0]?.kind ?? "image",
      media_filename: v.media[0]?.name,
      headline: v.headline,
      primary_text: v.primary_text,
      description: v.description || undefined,
      cta: v.cta,
      link: v.link,
    } : undefined,
  }

  // Build platform_budgets from form state — only include valid entries
  const validPlatformBudgets: Record<string, { budget_type: string; amount: number }> = {}
  for (const [platform, pb] of Object.entries(v.platform_budgets ?? {})) {
    if (pb?.amount != null && pb.amount > 0) {
      validPlatformBudgets[platform] = { budget_type: pb.budget_type, amount: pb.amount }
    }
  }

  if (Object.keys(validPlatformBudgets).length > 0) {
    payload.platform_budgets = validPlatformBudgets
  } else {
    // Legacy fallback: send global budget fields only when non-null
    if (v.budget_mode === "daily" && v.budget_usd != null) {
      payload.budget_usd = v.budget_usd
    } else if (v.budget_mode === "lifetime" && v.lifetime_budget != null) {
      payload.lifetime_budget = v.lifetime_budget
    }
  }

  return payload
}
