import { apiClient } from "./client"

// ============================================================
// Types
// ============================================================

export interface ConsolidatedCampaign {
  campaign_id: string
  name: string
  platform: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  cpc: number
  roa: number | null
  /** Normalized status: 'active' | 'paused' | 'removed' | 'unknown' */
  status?: string
}

export interface ConsolidatedPlatform {
  platform: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  cpc: number
  roa: number | null
  campaigns: ConsolidatedCampaign[]
}

export interface ConsolidatedTotals {
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  cpc: number
  cpm: number
  roa: number | null
}

export interface ConsolidatedDashboardResult {
  needs_sync: boolean
  last_synced_at: string | null
  totals: ConsolidatedTotals
  platforms: ConsolidatedPlatform[]
  campaigns: ConsolidatedCampaign[]
}

// ============================================================
// GET /v1/dashboard/consolidated
// Reads cached data from DB — fast, no platform API calls.
// ============================================================
export const getConsolidatedDashboard = async (
  clientId: string,
  platform?: string,
  dateRange?: { since: string; until: string }
): Promise<ConsolidatedDashboardResult> => {
  const params: Record<string, string> = { client_id: clientId }
  if (platform) params.platform = platform
  if (dateRange) {
    params.since = dateRange.since
    params.until = dateRange.until
  }
  const { data } = await apiClient.get("/v1/dashboard/consolidated", { params })
  return data as ConsolidatedDashboardResult
}

// ============================================================
// POST /v1/dashboard/sync
// Fetches fresh data from platform APIs and updates cache.
// Slower (3-10s). Called only when user presses "Actualizar".
// ============================================================
export const syncDashboard = async (
  clientId: string,
  dateRange?: { since: string; until: string }
): Promise<ConsolidatedDashboardResult> => {
  const { data } = await apiClient.post("/v1/dashboard/sync", {
    client_id: clientId,
    ...(dateRange ?? {}),
  })
  return data as ConsolidatedDashboardResult
}
