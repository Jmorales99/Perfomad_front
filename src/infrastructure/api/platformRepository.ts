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
export const getDashboardPlatformSummary = async (): Promise<DashboardPlatformSummary> => {
  const { data } = await apiClient.get("/v1/dashboard/platform-summary")
  return data
}

