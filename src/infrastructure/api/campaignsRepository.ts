import { apiClient } from "./client"

export type Platform = "meta" | "google_ads" | "linkedin"
export type CampaignStatus = "active" | "paused" | "completed"

export interface CampaignDTO {
  id: string
  platforms: Platform[]          // 👈 antes era platform
  name: string
  description?: string
  budget_usd: number
  spend_usd: number
  status: CampaignStatus
  start_date: string
  end_date: string | null
  number?: number
  images?: { path?: string; signed_url?: string }[]
}

// ============================================================
// 📦 GET /v1/campaigns
// ============================================================
export const getCampaigns = async (): Promise<CampaignDTO[]> => {
  const { data } = await apiClient.get("/v1/campaigns")
  return data
}

// ============================================================
// 🆕 POST /v1/campaigns
// ============================================================
export const createCampaign = async (payload: {
  name: string
  platforms: Platform[]          // 👈 antes era platform
  description?: string
  budget_usd?: number
  images?: { path: string }[]    // 👈 añadido
}) => {
  const { data } = await apiClient.post("/v1/campaigns", payload)
  return data
}

// ============================================================
// ✏️ PUT /v1/campaigns/:id
// ============================================================
export const updateCampaign = async (
  id: string,
  payload: Partial<{
    name: string
    description: string
    budget_usd: number
    platforms: Platform[]         // 👈 antes era platform
    status: CampaignStatus
    images?: { path: string }[]
  }>
) => {
  const { data } = await apiClient.put(`/v1/campaigns/${id}`, payload)
  return data
}

// ============================================================
// ❌ DELETE /v1/campaigns/:id
// ============================================================
export const deleteCampaign = async (id: string) => {
  const { data } = await apiClient.delete(`/v1/campaigns/${id}`)
  return data
}
