import { apiClient } from "./client"

export type Platform = "meta" | "google_ads" | "linkedin"
export type CampaignStatus = "active" | "paused" | "completed"

// ============================================================
// 🧩 DTO actualizado (alineado con el backend mock)
// ============================================================
export interface CampaignDTO {
  id: string
  platforms: Platform[]
  name: string
  description?: string
  budget_usd: number
  spend_usd: number
  status: CampaignStatus
  start_date: string
  end_date: string | null
  number?: number
  images?: { path?: string; signed_url?: string }[]

  // 🆕 Campos nuevos del backend mock
  mock_campaign_id?: string
  mock_stats?: {
    spend: number
    impressions: number
    clicks: number
    ctr: number
  }
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
  platforms: Platform[]
  description?: string
  budget_usd?: number
  images?: { path: string }[]
}) => {
  const { data } = await apiClient.post("/v1/campaigns", payload)
  return data as CampaignDTO
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
    platforms: Platform[]
    status: CampaignStatus
    images?: { path: string }[]
  }>
) => {
  const { data } = await apiClient.put(`/v1/campaigns/${id}`, payload)
  return data as CampaignDTO
}

// ============================================================
// ❌ DELETE /v1/campaigns/:id
// ============================================================
export const deleteCampaign = async (id: string) => {
  const { data } = await apiClient.delete(`/v1/campaigns/${id}`)
  return data
}

// 📊 GET /v1/campaigns/:id/overview
export const getCampaignOverview = async (id: string) => {
  const { data } = await apiClient.get(`/v1/campaigns/${id}/overview`)
  return data
}
