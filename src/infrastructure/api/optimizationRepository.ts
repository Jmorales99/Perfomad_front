import { apiClient } from "./client"

export type OptimizationActionType =
  | "pause_campaign"
  | "resume_campaign"
  | "adjust_budget"
  | "flag_for_review"
  | "informational"

export type OptimizationPriority = "high" | "medium" | "low"

export type PlatformSupport = "automatic" | "manual_required" | "unsupported"

export type OptimizationStatus =
  | "succeeded"
  | "failed"
  | "insufficient_data"
  | "pending"

export interface OptimizationRecommendation {
  id: string
  external_id: string
  action_type: OptimizationActionType
  priority: OptimizationPriority
  title: string
  rationale: string | null
  expected_impact: string | null
  params: Record<string, unknown>
  requires_confirmation: boolean
  confidence: number | null
  platform_support: PlatformSupport
}

export interface Alert {
  urgency: "immediate" | "today" | "this_week"
  type: string
  message: string
}

export interface HealthScoreCriteria {
  ctr_performance: number
  cpa_efficiency: number
  budget_utilization: number
  creative_freshness: number
}

export interface OptimizationSummary {
  overall_health: "good" | "warning" | "critical"
  headline: string
  health_score?: number
  health_score_criteria?: HealthScoreCriteria
  health_trend?: {
    direction: "improving" | "stable" | "declining"
    delta_pts?: number | null
  }
  alerts?: Alert[]
  next_step?: string
}

export interface AnalyzeResult {
  run_id: string
  cached: boolean
  status: OptimizationStatus
  summary: OptimizationSummary | null
  recommendations: OptimizationRecommendation[]
  insufficient_data?: {
    days_active: number
    spend: number
    min_days: number
    min_spend: number
  }
  error_message?: string
}

export type ApplyDecision = "accept" | "reject"

export type ApplyResultStatus =
  | "succeeded"
  | "failed"
  | "manual_required"
  | "unsupported"
  | "skipped"
  | "rejected"

export interface ApplyResult {
  decision_id: string
  execution_id: string | null
  status: ApplyResultStatus
  platform: string | null
  action_type: string
  message: string
  idempotent_replay: boolean
}

export interface OptimizationRunSummary {
  id: string
  status: OptimizationStatus
  prompt_version: string
  model: string
  summary: OptimizationSummary | null
  created_at: string
  recommendations_count?: number
}

export interface RecommendationDecision {
  id: string
  decision: "accept" | "reject" | "defer"
  created_at: string
}

export interface RecommendationWithDecision extends OptimizationRecommendation {
  latest_decision: RecommendationDecision | null
  latest_execution_status: ApplyResultStatus | null
}

export interface LatestRecommendationsResult {
  run_id: string | null
  status: OptimizationStatus | null
  summary: OptimizationSummary | null
  recommendations: RecommendationWithDecision[]
  generated_at: string | null
}

export const analyzeCampaign = async (
  campaignId: string
): Promise<AnalyzeResult> => {
  const { data } = await apiClient.post(
    `/v1/campaigns/${campaignId}/optimize/analyze`
  )
  return data
}

export const applyRecommendation = async (
  campaignId: string,
  payload: {
    recommendation_id: string
    decision: ApplyDecision
    override_params?: Record<string, unknown>
    notes?: string
  }
): Promise<ApplyResult> => {
  const { data } = await apiClient.post(
    `/v1/campaigns/${campaignId}/optimize/apply`,
    payload
  )
  return data
}

export const listOptimizationRuns = async (
  campaignId: string,
  limit = 20
): Promise<{ runs: OptimizationRunSummary[] }> => {
  const { data } = await apiClient.get(
    `/v1/campaigns/${campaignId}/optimize/runs`,
    { params: { limit } }
  )
  return data
}

export const getLatestRecommendations = async (
  campaignId: string
): Promise<LatestRecommendationsResult> => {
  const { data } = await apiClient.get(
    `/v1/campaigns/${campaignId}/optimize/recommendations/latest`
  )
  return data
}

// ============================================================
// Budget sync
// ============================================================

export interface SyncBudgetResult {
  campaign_id: string
  platform: string | null
  local_daily: number | null
  local_lifetime: number | null
  platform_daily: number | null
  platform_lifetime: number | null
  drift_pct: number | null
  budget_sync_status: "in_sync" | "drifted" | "unknown" | "error"
  source_of_truth: "local" | "platform"
  spend_platform: number | null
  error?: string
}

export const syncBudgetFromPlatform = async (
  campaignId: string,
  promote = false
): Promise<SyncBudgetResult> => {
  const { data } = await apiClient.post(
    `/v1/campaigns/${campaignId}/budget/sync-from-platform`,
    { promote }
  )
  return data
}

// ============================================================
// Ad sets / ads (hierarchical creatives)
// ============================================================

export interface AdSetSummary {
  adset_id: string
  name: string
  status: string
  daily_budget?: number | null
  lifetime_budget?: number | null
  /** Google Ads: budgets are usually campaign-level; Meta: ad set level. */
  budget_scope?: "campaign" | "adset" | null
  optimization_goal?: string | null
  targeting_summary?: string | null
  metrics?: {
    impressions?: number
    clicks?: number
    spend?: number
    conversions?: number
    revenue?: number
  }
}

export interface AdCreativeCard {
  /** Low-res preview returned directly by the platform. */
  thumbnail_url?: string | null
  /** Full-resolution image URL, populated by backend enrichment when available. */
  image_url?: string | null
  /** Direct video playback URL (only for carousels with videos). */
  video_url?: string | null
  link?: string | null
  name?: string | null
  /** Optional fields some platforms return alongside the creative. */
  description?: string | null
  title?: string | null
}

export interface AdDetail {
  ad_id: string
  name: string
  status: string
  effective_status?: string
  creative?: {
    creative_id?: string
    type?: string
    thumbnail_url?: string | null
    image_url?: string | null
    video_url?: string | null
    cards?: AdCreativeCard[]
  }
  metrics?: {
    impressions?: number
    clicks?: number
    spend?: number
    conversions?: number
    revenue?: number
    ctr?: number
    cpc?: number
    cpm?: number
    roas?: number
  }
}

export interface AdSetLookupContext {
  /** Required when campaignId is a platform-native id (not our internal UUID). */
  clientId?: string
  platform?: "meta" | "google_ads" | "linkedin" | "tiktok"
  since?: string
  until?: string
}

export const listCampaignAdSets = async (
  campaignId: string,
  ctx?: AdSetLookupContext
): Promise<{ platform: string; adsets: AdSetSummary[] }> => {
  const { data } = await apiClient.get(
    `/v1/campaigns/${campaignId}/adsets`,
    {
      params: {
        since: ctx?.since,
        until: ctx?.until,
        clientId: ctx?.clientId,
        platform: ctx?.platform,
      },
    }
  )
  return data
}

export const listAdSetAds = async (
  campaignId: string,
  adSetId: string,
  ctx?: Pick<AdSetLookupContext, "clientId" | "platform">
): Promise<{ platform: string; ads: AdDetail[] }> => {
  const { data } = await apiClient.get(
    `/v1/campaigns/${campaignId}/adsets/${adSetId}/ads`,
    {
      params: {
        clientId: ctx?.clientId,
        platform: ctx?.platform,
      },
    }
  )
  return data
}
