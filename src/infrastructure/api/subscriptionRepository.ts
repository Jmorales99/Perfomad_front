import { apiClient } from "./client"
import { getTikTokAccounts } from "@/infrastructure/repositories/integrations/tiktokRepository"

export type Platform = "meta" | "google_ads" | "linkedin" | "tiktok"

export interface ConnectedAccount {
  id: string
  platform: Platform
  platform_account_id: string
  account_name: string | null
  currency: string
  is_active: boolean
  connected_at: string
}

// ============================================================
// 💳 Activate Subscription
// ============================================================
export const activateSubscription = async () => {
  const { data } = await apiClient.post("/v1/subscription/activate")
  return data
}

// ============================================================
// 🔗 Create Connection Link
// ============================================================
export const createConnectionLink = async (
  platform: Platform,
  redirectUri?: string,
  state?: string
) => {
  const { data } = await apiClient.post("/v1/subscription/connect-account", {
    platform,
    redirect_uri: redirectUri,
    state,
  })
  return data as { link: string; platform: string }
}

// ============================================================
// 🔄 Sync Connected Accounts
// ============================================================
export const syncConnectedAccounts = async () => {
  const { data } = await apiClient.post("/v1/subscription/sync-accounts")
  return data as {
    message: string
    accounts: ConnectedAccount[]
    count: number
  }
}

// ============================================================
// 📋 Get Connected Accounts
// ============================================================
export const getConnectedAccounts = async () => {
  const { data } = await apiClient.get("/v1/subscription/accounts")
  return data as {
    accounts: ConnectedAccount[]
    count: number
  }
}

/**
 * Subscription list + TikTok rows from GET /v1/platforms/tiktok/accounts (per brand).
 * Use when clientId is known so TikTok can be validated for campaigns.
 */
export const getConnectedAccountsForBrand = async (
  clientId: string | null | undefined
): Promise<ConnectedAccount[]> => {
  let base: ConnectedAccount[] = []
  try {
    const data = await getConnectedAccounts()
    base = (data.accounts ?? []).filter((a) => a.is_active)
  } catch {
    base = []
  }
  if (!clientId) {
    return base
  }
  try {
    const tiktokRows = await getTikTokAccounts(clientId)
    const mapped: ConnectedAccount[] = tiktokRows
      .filter((a) => a.is_active)
      .map((a) => ({
        id: a.id,
        platform: "tiktok" as const,
        platform_account_id: a.platform_account_id,
        account_name: a.account_name,
        currency: a.currency ?? "USD",
        is_active: a.is_active,
        connected_at: a.connected_at ?? new Date().toISOString(),
      }))
    const withoutTiktok = base.filter((a) => a.platform !== "tiktok")
    return [...withoutTiktok, ...mapped]
  } catch {
    return base
  }
}

// ============================================================
// 🔗 Connect Account (with credentials)
// ============================================================
export const connectAccount = async (
  platform: Platform,
  credentials: {
    email: string
    password: string
  }
) => {
  const { data } = await apiClient.post("/v1/subscription/connect-account-with-credentials", {
    platform,
    credentials,
  })
  return data as {
    message: string
    account: ConnectedAccount
  }
}

