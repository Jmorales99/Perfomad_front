import { apiClient } from "./client"

export type Platform = "meta" | "google_ads" | "linkedin"

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

