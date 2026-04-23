// src/infrastructure/repositories/integrations/googleAdsRepository.ts
import { apiClient } from '@/infrastructure/api/client'

// ── OAuth / connection ─────────────────────────────────────────────────────────

export interface GoogleAdsConnectLinkResponse {
  url: string
}

export interface GoogleAdsSyncAccountsResponse {
  synced: number
  accounts: GoogleAdsAdAccount[]
}

// ── Ad accounts ────────────────────────────────────────────────────────────────
// GET /v1/platforms/google_ads/accounts → { platform, clientId, accounts: [...] }

export interface GoogleAdsAdAccount {
  /** UUID in the database (do NOT use as adAccountId in metrics calls). */
  id: string
  /** Google Ads customer ID — use this as adAccountId in all metrics calls. */
  platform_account_id: string
  account_name: string | null
  currency: string
  is_active: boolean
  connected_at?: string
  last_synced_at?: string
}

/**
 * POST /v1/platforms/google_ads/connect-link
 * Returns the Google OAuth URL. Redirects the browser there to start the flow.
 */
export const getGoogleAdsConnectLink = async (
  clientId: string,
  redirectUri?: string
): Promise<GoogleAdsConnectLinkResponse> => {
  const body: Record<string, string> = { clientId }
  if (redirectUri) body.redirectUri = redirectUri
  const { data } = await apiClient.post('/v1/platforms/google_ads/connect-link', body)
  return data as GoogleAdsConnectLinkResponse
}

/**
 * POST /v1/platforms/google_ads/sync-accounts
 * Refreshes account metadata from Google Ads API for the given brand.
 */
export const syncGoogleAdsAccounts = async (
  clientId: string
): Promise<GoogleAdsSyncAccountsResponse> => {
  const { data } = await apiClient.post('/v1/platforms/google_ads/sync-accounts', { clientId })
  return data as GoogleAdsSyncAccountsResponse
}

/**
 * GET /v1/platforms/google_ads/accounts?clientId=...
 * Returns connected ad accounts for the brand.
 * Use platform_account_id (Google customer ID) as adAccountId in metrics calls.
 */
export const getGoogleAdsAdAccounts = async (
  clientId: string
): Promise<GoogleAdsAdAccount[]> => {
  const { data } = await apiClient.get('/v1/platforms/google_ads/accounts', {
    params: { clientId },
  })
  return (data.accounts ?? data) as GoogleAdsAdAccount[]
}

// ── Metrics ───────────────────────────────────────────────────────────────────
// GET /v1/platforms/google_ads/metrics → { platform, adAccountId, accountName,
//   currency, dateRange, summary, metrics }
//
// NOTE: reach is always 0 for Google Ads (no reach metric equivalent to Meta).
// conversions / revenue are derived from actions[action_type="conversion"].

export interface GoogleAdsMetricsParams {
  clientId: string
  /** Use platform_account_id from GoogleAdsAdAccount (Google customer ID). */
  adAccountId: string
  since: string  // YYYY-MM-DD
  until: string  // YYYY-MM-DD
}

export interface GoogleAdsMetrics {
  spend: number
  impressions: number
  clicks: number
  /** Always 0 — Google Ads has no reach metric. */
  reach: number
  ctr: number
  cpc: number
  cpm: number
  conversions?: number
  revenue?: number
  cpa?: number
  roas?: number
  actions?: Array<{ action_type: string; value: string }>
  action_values?: Array<{ action_type: string; value: string }>
  [key: string]: unknown
}

export interface GoogleAdsMetricsResponse {
  platform: string
  adAccountId: string
  accountName?: string
  currency?: string
  dateRange: { since: string; until: string }
  summary?: { connected_accounts: number; is_connected: boolean; total_spend: number }
  metrics: GoogleAdsMetrics
}

export const getGoogleAdsMetrics = async (
  params: GoogleAdsMetricsParams
): Promise<GoogleAdsMetricsResponse> => {
  const { data } = await apiClient.get('/v1/platforms/google_ads/metrics', { params })
  return data as GoogleAdsMetricsResponse
}

// ── Campaigns ─────────────────────────────────────────────────────────────────
// GET /v1/platforms/google_ads/campaigns → { platform, clientId, adAccountId,
//   accountName, currency, dateRange, campaigns }

export interface GoogleAdsCampaign {
  campaign_id: string
  campaign_name: string
  name?: string
  id?: string
  status?: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  /** Derived from actions[action_type="conversion"]. */
  conversions: number
  /** Derived from action_values[action_type="conversion"]. */
  revenue: number
  roas: number | null
  cpa: number | null
  actions?: Array<{ action_type: string; value: string }>
  action_values?: Array<{ action_type: string; value: string }>
}

export interface GoogleAdsCampaignsResponse {
  campaigns: GoogleAdsCampaign[]
  total?: number
  adAccountId: string
  dateRange: { since: string; until: string }
}

export const getGoogleAdsCampaigns = async (params: {
  clientId: string
  adAccountId?: string
  since?: string
  until?: string
}): Promise<GoogleAdsCampaignsResponse> => {
  const { data } = await apiClient.get('/v1/platforms/google_ads/campaigns', { params })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = data as any
  const rawList: any[] = Array.isArray(raw) ? raw : (raw.campaigns ?? [])
  const campaigns: GoogleAdsCampaign[] = rawList.map((c: any) => ({
    ...c,
    campaign_id:   c.campaign_id   ?? c.id   ?? "",
    campaign_name: c.campaign_name ?? c.name ?? "",
  }))
  return {
    campaigns,
    total:       raw.total,
    adAccountId: raw.adAccountId ?? params.adAccountId ?? "",
    dateRange:   raw.dateRange ?? { since: params.since ?? "", until: params.until ?? "" },
  }
}

// ── Ads ───────────────────────────────────────────────────────────────────────
// GET /v1/platforms/google_ads/campaigns/:campaignId/ads
//
// Creative media is returned when available:
// - IMAGE_AD        → image_url / thumbnail_url (direct URL)
// - RESPONSIVE_DISPLAY_AD → image_url / cards (resolved from asset batch)
// - VIDEO_AD        → video_url + YouTube thumbnail_url
// - RSA / ETA / other text-based ads → type="unknown", all URLs null

export interface GoogleAdsAdCreative {
  type: "image" | "video" | "carousel" | "unknown"
  thumbnail_url: string | null
  image_url: string | null
  video_url?: string | null
  cards: Array<{ thumbnail_url: string | null; link: string | null; name: string | null }>
  /** RSA / ETA headline texts. */
  headlines?: string[]
  /** RSA / ETA description texts. */
  descriptions?: string[]
  /** Landing page URLs. */
  final_urls?: string[]
  /** Google Ads ad type (e.g. RESPONSIVE_SEARCH_AD, IMAGE_AD, VIDEO_AD). */
  ad_type?: string
}

export interface GoogleAdsAd {
  id: string
  name: string
  status?: string
  creative?: GoogleAdsAdCreative
  spend?: number
  impressions?: number
  clicks?: number
  ctr?: number
  conversions?: number
  roas?: number | null
  revenue?: number
  cpa?: number | null
}

export interface GoogleAdsAdsResponse {
  ads: GoogleAdsAd[]
  total?: number
  campaignId: string
  campaignName?: string
}

export const getGoogleAdsAds = async (params: {
  campaignId: string
  clientId: string
  adAccountId?: string
  since?: string
  until?: string
}): Promise<GoogleAdsAdsResponse> => {
  const { campaignId, ...queryParams } = params
  const { data } = await apiClient.get(
    `/v1/platforms/google_ads/campaigns/${campaignId}/ads`,
    { params: queryParams }
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = data as any
  const rawList: any[] = Array.isArray(raw) ? raw : (raw.ads ?? raw.data ?? [])
  const ads: GoogleAdsAd[] = rawList.map((a: any) => ({
    ...a,
    id:   a.id   ?? a.ad_id   ?? "",
    name: a.name ?? a.ad_name ?? "",
  }))
  return {
    ads,
    total:        raw.total,
    campaignId:   raw.campaignId ?? campaignId,
    campaignName: raw.campaignName ?? "",
  }
}
