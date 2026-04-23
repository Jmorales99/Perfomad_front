import { apiClient } from "@/infrastructure/api/client"

// ── OAuth / connection ─────────────────────────────────────────────────────────

export interface TikTokConnectLinkResponse {
  url: string
}

/**
 * POST /v1/platforms/tiktok/connect-link
 */
export const getTikTokConnectLink = async (
  clientId: string,
  redirectUri?: string
): Promise<TikTokConnectLinkResponse> => {
  const body: Record<string, string> = { clientId }
  if (redirectUri) body.redirectUri = redirectUri
  const { data } = await apiClient.post("/v1/platforms/tiktok/connect-link", body)
  return data as TikTokConnectLinkResponse
}

// ── Advertisers (post-OAuth) ───────────────────────────────────────────────────

export interface TikTokAdvertiser {
  id: string
  name: string
  currency?: string
}

export interface ListTikTokAdvertisersResponse {
  advertisers: TikTokAdvertiser[]
  selectionPending: boolean
  isConnected: boolean
}

/**
 * GET /v1/platforms/tiktok/advertisers?clientId=
 */
export const listTikTokAdvertisers = async (
  clientId: string
): Promise<ListTikTokAdvertisersResponse> => {
  const { data } = await apiClient.get("/v1/platforms/tiktok/advertisers", {
    params: { clientId },
  })
  return data as ListTikTokAdvertisersResponse
}

/**
 * POST /v1/platforms/tiktok/select-advertiser
 */
export const selectTikTokAdvertiser = async (
  clientId: string,
  advertiserId: string
): Promise<{ ok: boolean; accountId?: string }> => {
  const { data } = await apiClient.post("/v1/platforms/tiktok/select-advertiser", {
    clientId,
    advertiserId,
  })
  return data as { ok: boolean; accountId?: string }
}

/**
 * POST /v1/platforms/tiktok/disconnect
 */
export const disconnectTikTok = async (clientId: string): Promise<unknown> => {
  const { data } = await apiClient.post("/v1/platforms/tiktok/disconnect", { clientId })
  return data
}

// ── Ad accounts (same shape as Meta/Google platform accounts) ─────────────────

export interface TikTokAdAccount {
  id: string
  platform_account_id: string
  account_name: string | null
  currency?: string
  is_active: boolean
  connected_at?: string
  last_synced_at?: string
}

/**
 * GET /v1/platforms/tiktok/accounts?clientId=
 */
export const getTikTokAccounts = async (clientId: string): Promise<TikTokAdAccount[]> => {
  const { data } = await apiClient.get("/v1/platforms/tiktok/accounts", {
    params: { clientId },
  })
  return (data.accounts ?? data) as TikTokAdAccount[]
}
