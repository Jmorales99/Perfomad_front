import { apiClient } from "./client"

export type Platform = "meta" | "google_ads" | "linkedin"
export type CampaignStatus = "active" | "paused" | "completed"

// ============================================================
// 🧩 Error Response Types
// ============================================================
export interface AdAccountError {
  error: "NO_AD_ACCOUNTS" | "MISSING_PLATFORM_ACCOUNTS" | string
  message: string
  title?: string
  details?: string
  action_required?: string
  help_url?: string
  action_button_text?: string
  show_popup?: boolean
  missing_platforms?: string[]
  missing_platform_names?: string[]
}

// ============================================================
// 🧩 DTO actualizado (alineado con el backend)
// ============================================================
export interface CampaignDTO {
  id: string
  platforms: Platform[]
  name: string
  description?: string
  budget_usd: number
  lifetime_budget?: number // Alternative to daily budget
  spend_usd: number
  status: CampaignStatus
  start_date: string
  end_date: string | null
  created_at?: string // Creation date for filtering
  number?: number
  images?: { path?: string; signed_url?: string }[]

  // Platform-specific fields
  objective?: string // Meta: OUTCOME_TRAFFIC, OUTCOME_SALES, etc.
  billing_event?: string // Meta: IMPRESSIONS, LINK_CLICKS, etc.
  bid_strategy?: string // Meta: LOWEST_COST_WITHOUT_CAP, COST_CAP, etc.
  special_ad_categories?: string[] // Meta: ['HOUSING', 'EMPLOYMENT', 'CREDIT']
  platform_settings?: {
    meta?: Record<string, any>
    google_ads?: Record<string, any>
    linkedin?: Record<string, any>
  }

  // Product pricing (for accurate ROA calculation)
  product_price?: number // Selling price per product unit
  product_cost?: number // Production cost per product unit (optional)

  // 🆕 Campos del backend
  mock_campaign_id?: string | Record<string, string>
  mock_stats?: {
    spend: number
    impressions: number
    clicks: number
    ctr: number
    conversions?: number
    revenue?: number
    total_sales?: number
    cpa?: number
    roa?: number
    cost_per_click?: number
    cpm?: number
    reach?: number
    cost_per_conversion?: number
  }
}

// ============================================================
// 📋 Campaign Creation/Update Payload
// ============================================================
export interface CreateCampaignPayload {
  name: string
  platforms: Platform[]
  description?: string
  budget_usd?: number
  lifetime_budget?: number
  objective?: string
  billing_event?: string
  bid_strategy?: string
  status?: "ACTIVE" | "PAUSED"
  special_ad_categories?: string[]
  start_date?: string
  end_date?: string | null
  meta_settings?: Record<string, any>
  product_price?: number // Selling price per product unit (for ROA calculation)
  product_cost?: number // Production cost per product unit (optional, for profit-based ROA)
  images?: { path: string }[]
}

// ============================================================
// 📦 GET /v1/campaigns
// ============================================================
export const getCampaigns = async (): Promise<CampaignDTO[]> => {
  const { data } = await apiClient.get("/v1/campaigns")
  return data
}

// ============================================================
// 📋 GET /v1/campaigns/:id
// ============================================================
export const getCampaignById = async (id: string): Promise<CampaignDTO> => {
  const { data } = await apiClient.get(`/v1/campaigns/${id}`)
  return data
}

// ============================================================
// 📋 GET /v1/campaigns/can-create
// ============================================================
export interface CanCreateResponse {
  can_create: boolean
  has_subscription: boolean
  has_plai_account: boolean
  ad_accounts_count: number
  ad_accounts: Array<{
    platform: Platform
    account_name: string
    is_active: boolean
  }>
  missing_requirements: string[]
  message: string
}

export const checkCanCreateCampaign = async (): Promise<CanCreateResponse> => {
  const { data } = await apiClient.get("/v1/campaigns/can-create")
  return data
}

// ============================================================
// 🆕 POST /v1/campaigns
// ============================================================
export const createCampaign = async (
  payload: CreateCampaignPayload
): Promise<CampaignDTO> => {
  try {
    const { data } = await apiClient.post("/v1/campaigns", payload)
    return data as CampaignDTO
  } catch (error: any) {
    // Check if it's an ad account error
    if (error.response?.status === 400 && error.response?.data?.show_popup) {
      // Re-throw with structured error data
      const errorData: AdAccountError = error.response.data
      throw errorData
    }
    // Re-throw other errors
    throw error
  }
}

// ============================================================
// ✏️ PATCH /v1/campaigns/:id
// ============================================================
export const updateCampaign = async (
  id: string,
  payload: Partial<CreateCampaignPayload & {
    status: CampaignStatus
  }>
): Promise<CampaignDTO> => {
  try {
    const { data } = await apiClient.patch(`/v1/campaigns/${id}`, payload)
    return data as CampaignDTO
  } catch (error: any) {
    // Check if it's an ad account error
    if (error.response?.status === 400 && error.response?.data?.show_popup) {
      const errorData: AdAccountError = error.response.data
      throw errorData
    }
    throw error
  }
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

// 📊 GET /v1/campaigns/:id/insights
export const getCampaignInsights = async (id: string) => {
  const { data } = await apiClient.get(`/v1/campaigns/${id}/insights`)
  return data
}

// 🔄 POST /v1/campaigns/:id/sync
export const syncCampaignMetrics = async (id: string) => {
  const { data } = await apiClient.post(`/v1/campaigns/${id}/sync`)
  return data
}

// 📈 GET /v1/dashboard/metrics
export const getDashboardMetrics = async () => {
  const { data } = await apiClient.get("/v1/dashboard/metrics")
  return data
}

// 📊 GET /v1/campaigns/:id/sales-history
export interface SalesHistoryPoint {
  date: string
  total_sales: number
  revenue: number
  conversions: number
  spend: number
  cpa?: number
  roa?: number
}

export interface SalesHistoryResponse {
  data: SalesHistoryPoint[]
  improvement: number | null
  period_days: number
}

export const getCampaignSalesHistory = async (
  id: string,
  days: number = 30
): Promise<SalesHistoryResponse> => {
  const { data } = await apiClient.get(`/v1/campaigns/${id}/sales-history`, {
    params: { days },
  })
  return data
}

// 📊 GET /v1/dashboard/sales-history
export const getDashboardSalesHistory = async (
  days: number = 30,
  campaignIds?: string[],
  platforms?: Platform[]
): Promise<SalesHistoryResponse> => {
  const params: any = { days }
  
  if (campaignIds && campaignIds.length > 0) {
    params.campaign_ids = campaignIds.join(",")
  }
  
  if (platforms && platforms.length > 0) {
    params.platforms = platforms.join(",")
  }
  
  const { data } = await apiClient.get("/v1/dashboard/sales-history", {
    params,
  })
  return data
}