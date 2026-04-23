import { apiClient } from "./client"
import type { Platform, CampaignDTO } from "./campaignsRepository"

export type MultichannelStatus =
  | "draft"
  | "publishing"
  | "active"
  | "paused"
  | "partial_failed"
  | "completed"
  | "archived"

export interface MultichannelCampaign {
  id: string
  user_id: string
  client_id: string
  name: string
  objective?: string | null
  status: MultichannelStatus
  total_budget_usd?: number | null
  currency: string
  platforms: Platform[]
  start_date?: string | null
  end_date?: string | null
  created_by: string
  created_at: string
  updated_at: string
  published_at?: string | null
  archived_at?: string | null
  campaign?: CampaignDTO | null
}

export interface MultichannelPlatformBudget {
  platform: Platform
  budget: { type: "daily" | "lifetime"; amount: number }
}

export interface MultichannelCreative {
  pageId?: string
  mediaUrl?: string
  mediaType?: "image" | "video"
  mediaFilename?: string
  headline?: string
  primaryText?: string
  description?: string
  cta?: string
  link?: string
}

export interface CreateMultichannelCampaignPayload {
  clientId: string
  name: string
  objective?: string
  totalBudgetUsd?: number
  platforms: MultichannelPlatformBudget[]
  startDate?: string
  endDate?: string
  billingEvent?: string
  bidStrategy?: string
  specialAdCategories?: string[]
  targeting?: {
    geoCountries?: string[]
    ageMin?: number
    ageMax?: number
    genders?: string[]
  }
  creative?: MultichannelCreative | Partial<Record<Platform, MultichannelCreative>>
  productPrice?: number
  productCost?: number
}

export interface MultichannelPlatformMetrics {
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  revenue: number
  roas: number
}

export interface MultichannelMetrics {
  consolidated: MultichannelPlatformMetrics
  by_platform: Partial<Record<Platform, MultichannelPlatformMetrics>>
}

export const listMultichannelCampaigns = async (
  clientId?: string | null
): Promise<MultichannelCampaign[]> => {
  const params = clientId ? { clientId } : undefined
  const { data } = await apiClient.get("/v1/multichannel-campaigns", { params })
  return data
}

export const getMultichannelCampaign = async (
  id: string
): Promise<MultichannelCampaign> => {
  const { data } = await apiClient.get(`/v1/multichannel-campaigns/${id}`)
  return data
}

export const getMultichannelMetrics = async (
  id: string
): Promise<MultichannelMetrics> => {
  const { data } = await apiClient.get(`/v1/multichannel-campaigns/${id}/metrics`)
  return data
}

export const createMultichannelCampaign = async (
  payload: CreateMultichannelCampaignPayload
): Promise<MultichannelCampaign> => {
  const { data } = await apiClient.post("/v1/multichannel-campaigns", payload)
  return data
}

export const updateMultichannelStatus = async (
  id: string,
  action: "pause" | "resume" | "archive"
): Promise<MultichannelCampaign> => {
  const { data } = await apiClient.patch(
    `/v1/multichannel-campaigns/${id}/status`,
    { action }
  )
  return data
}

export const updateMultichannelPlatformStatus = async (
  id: string,
  platform: Platform,
  action: "pause" | "resume"
): Promise<MultichannelCampaign> => {
  const { data } = await apiClient.patch(
    `/v1/multichannel-campaigns/${id}/platforms/${platform}/status`,
    { action }
  )
  return data
}
