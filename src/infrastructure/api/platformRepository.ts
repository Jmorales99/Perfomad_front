import { apiClient } from "./client"
import type { Platform } from "./campaignsRepository"

export type { Platform }

// ============================================================
// 📦 Platform Types
// ============================================================

export interface PlatformMetrics {
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  sales: number
  ctr: number
  cpc: number
  cpm: number
  cpa?: number
  roa?: number
}

export interface PlatformSummary {
  platform: Platform
  connected_accounts: number
  total_campaigns: number
  active_campaigns: number
  metrics: PlatformMetrics
  is_connected: boolean
}

export interface PlatformMetricsResponse {
  platform: Platform
  summary: {
    total_campaigns: number
    active_campaigns: number
    connected_accounts: number
    total_spend: number
    total_budget: number
  }
  metrics: PlatformMetrics
  campaigns: Array<{
    id: string
    name: string
    status: "active" | "paused" | "completed"
    spend_usd: number
    budget_usd: number
  }>
  /** Opcional: algunas integraciones (p. ej. TikTok) pueden enviar estado de cuenta */
  is_connected?: boolean
  account_name?: string
}

export interface Recommendation {
  id: string
  type: string
  priority: "high" | "medium" | "low"
  title: string
  description: string
  action?: string
  impact?: string
}

export interface Trend {
  metric: string
  direction: "up" | "down" | "stable"
  percentage: number
  period: string
}

export interface PlatformInsightListItem {
  message: string
  severity: "high" | "medium" | "low"
  recommendation: string
}

export interface PlatformInsightsResponse {
  platform: Platform
  summary: {
    total_campaigns: number
    campaigns_with_insights: number
    total_recommendations: number
    priority_breakdown: {
      high: number
      medium: number
      low: number
    }
  }
  recommendations: Recommendation[]
  trends: Trend[]
  campaign_insights: Array<{
    campaign_id: string
    campaign_name: string
    recommendations: Recommendation[]
    trends: Trend[]
    insights: any
  }>
  /** Opcional: lista simple de insights para UI (p. ej. TikTok) */
  insights?: PlatformInsightListItem[]
}

export interface PlatformsSummaryResponse {
  platforms: PlatformSummary[]
  total_platforms_connected: number
  total_campaigns_across_platforms: number
}

export interface DashboardPlatformSummary {
  platforms: PlatformSummary[]
  total_platforms_connected: number
  total_campaigns_across_platforms: number
}

// ============================================================
// 📋 GET /v1/platforms/summary
// ============================================================
export const getPlatformsSummary = async (): Promise<PlatformsSummaryResponse> => {
  const { data } = await apiClient.get("/v1/platforms/summary")
  return data
}

// ============================================================
// 📊 GET /v1/platforms/:platform/metrics
// ============================================================
export const getPlatformMetrics = async (
  platform: Platform
): Promise<PlatformMetricsResponse> => {
  const { data } = await apiClient.get(`/v1/platforms/${platform}/metrics`)
  return data
}

// ============================================================
// 💡 GET /v1/platforms/:platform/insights
// ============================================================
export const getPlatformInsights = async (
  platform: Platform
): Promise<PlatformInsightsResponse> => {
  const { data } = await apiClient.get(`/v1/platforms/${platform}/insights`)
  return data
}

// ============================================================
// 📈 GET /v1/dashboard/platform-summary
// ============================================================
export const getDashboardPlatformSummary = async (clientId?: string | null): Promise<DashboardPlatformSummary> => {
  const params = clientId ? { client_id: clientId } : undefined
  const { data } = await apiClient.get("/v1/dashboard/platform-summary", { params })
  return data
}

// ============================================================
// GET /v1/platforms/:platform/metrics (account-level; requires clientId)
// ============================================================

/** Response aligned with backend PlatformsController GET .../metrics */
export interface PlatformAccountMetricsApiResponse {
  platform: string
  adAccountId: string
  accountName?: string
  currency?: string
  dateRange: { since: string; until: string }
  summary: {
    connected_accounts: number
    is_connected: boolean
    total_spend: number
  }
  metrics: {
    impressions: number
    clicks: number
    reach?: number
    spend: number
    ctr: number
    cpc: number
    cpm: number
    conversions?: number
    revenue?: number
    cpa?: number
    roas?: number
    actions?: Array<{ action_type: string; value: string }>
    action_values?: Array<{ action_type: string; value: string }>
  }
}

export const getPlatformAccountMetrics = async (
  platform: Platform,
  params: { clientId: string; adAccountId?: string; since?: string; until?: string }
): Promise<PlatformAccountMetricsApiResponse> => {
  const { data } = await apiClient.get(`/v1/platforms/${platform}/metrics`, {
    params: {
      clientId: params.clientId,
      adAccountId: params.adAccountId,
      since: params.since,
      until: params.until,
    },
  })
  return data as PlatformAccountMetricsApiResponse
}

/**
 * Imports a platform-native campaign into our local `campaigns` table so it
 * can be optimized with the AI pipeline. Idempotent: calling with the same
 * platformCampaignId returns the same internal UUID.
 */
export interface ImportPlatformCampaignResponse {
  id: string
  imported: boolean
}

export const listMetaPages = async (
  clientId: string
): Promise<Array<{ id: string; name: string }>> => {
  const { data } = await apiClient.get("/v1/platforms/meta/pages", {
    params: { clientId },
  })
  return (data as { pages: Array<{ id: string; name: string }> }).pages
}

export const importPlatformCampaign = async (
  platform: Platform,
  platformCampaignId: string,
  params: { clientId: string; adAccountId?: string }
): Promise<ImportPlatformCampaignResponse> => {
  const { data } = await apiClient.post(
    `/v1/platforms/${platform}/campaigns/${encodeURIComponent(platformCampaignId)}/import`,
    {
      clientId: params.clientId,
      adAccountId: params.adAccountId,
    }
  )
  return data as ImportPlatformCampaignResponse
}

export interface ImportStatusResponse {
  imported: boolean
  campaign_id: string | null
  campaign_name: string | null
}

export const checkImportStatus = async (
  platform: string,
  platformCampaignId: string
): Promise<ImportStatusResponse> => {
  const { data } = await apiClient.get("/v1/campaigns/by-platform-id", {
    params: { platform, platformCampaignId },
  })
  return data as ImportStatusResponse
}
