// src/infrastructure/repositories/integrations/metaRepository.ts
import { apiClient } from '@/infrastructure/api/client'

export interface MetaConnectLinkResponse {
  url: string
}

export interface MetaAccount {
  id: string
  name: string
  account_id?: string
  currency?: string
  status?: string
}

export interface MetaSyncAccountsResponse {
  synced: number
  accounts: MetaAccount[]
}

// ── Cuentas publicitarias ──────────────────────────────────────────────────────
// Shape exacto del backend:
// GET /v1/platforms/:platform/accounts → { platform, clientId, accounts: [...] }
// Cada cuenta: { id, platform_account_id, account_name, currency, is_active, connected_at, last_synced_at }

export interface MetaAdAccount {
  /** UUID de base de datos (no usar como adAccountId en métricas) */
  id: string
  /** ID real de la cuenta en Meta: "act_123456789". Usar SIEMPRE como adAccountId */
  platform_account_id: string
  account_name: string
  currency: string
  is_active: boolean
  connected_at?: string
  last_synced_at?: string
}

/**
 * GET /v1/platforms/meta/accounts?clientId=...
 * Devuelve cuentas conectadas para la marca. El campo a usar como adAccountId
 * en el endpoint de métricas es `platform_account_id`.
 */
export const getMetaAdAccounts = async (
  clientId: string
): Promise<MetaAdAccount[]> => {
  const { data } = await apiClient.get('/v1/platforms/meta/accounts', {
    params: { clientId },
  })
  // El backend devuelve { platform, clientId, accounts: [...] }
  return (data.accounts ?? data) as MetaAdAccount[]
}

// ── Métricas ───────────────────────────────────────────────────────────────────
// Shape exacto del backend:
// GET /v1/platforms/:platform/metrics → { platform, adAccountId, accountName, currency, dateRange, summary, metrics }
// metrics: { impressions, clicks, reach, spend, ctr, cpc, cpm, conversions, revenue, cpa, roas, actions, action_values }

export interface MetaMetricsParams {
  clientId: string
  /** Usar platform_account_id de MetaAdAccount (ej. "act_123456789") */
  adAccountId: string
  since: string  // YYYY-MM-DD
  until: string  // YYYY-MM-DD
}

export interface MetaMetrics {
  spend: number
  impressions: number
  clicks: number
  reach?: number
  ctr: number
  cpc: number
  cpm: number
  conversions?: number
  revenue?: number
  cpa?: number
  roas?: number
  frequency?: number
  actions?: Array<{ action_type: string; value: string }>
  action_values?: Array<{ action_type: string; value: string }>
  [key: string]: unknown
}

export interface MetaMetricsResponse {
  platform: string
  adAccountId: string
  accountName?: string
  currency?: string
  dateRange: { since: string; until: string }
  summary?: { connected_accounts: number; is_connected: boolean; total_spend: number }
  metrics: MetaMetrics
}

/**
 * GET /v1/platforms/meta/metrics?clientId=...&adAccountId=...&since=...&until=...
 * adAccountId debe ser platform_account_id (ej. "act_123456789").
 */
export const getMetaMetrics = async (
  params: MetaMetricsParams
): Promise<MetaMetricsResponse> => {
  const { data } = await apiClient.get('/v1/platforms/meta/metrics', { params })
  return data as MetaMetricsResponse
}

// ── Campañas ───────────────────────────────────────────────────────────────────
// GET /v1/platforms/meta/campaigns?clientId=...&adAccountId=...&since=...&until=...

export interface MetaCampaign {
  /** Normalizado: siempre presente tras getMetaCampaigns */
  campaign_id: string
  /** Normalizado: siempre presente tras getMetaCampaigns */
  campaign_name: string
  /** Campo original del backend (puede ser 'name') */
  name?: string
  /** Campo original del backend (puede ser 'id') */
  id?: string
  status?: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  conversions: number
  revenue: number
  roas: number | null
  cpa: number | null
  actions?: Array<{ action_type: string; value: string }>
  action_values?: Array<{ action_type: string; value: string }>
}

export interface MetaCampaignsResponse {
  campaigns: MetaCampaign[]
  total?: number
  adAccountId: string
  dateRange: { since: string; until: string }
}

export const getMetaCampaigns = async (params: {
  clientId: string
  adAccountId?: string
  since?: string
  until?: string
}): Promise<MetaCampaignsResponse> => {
  const { data } = await apiClient.get('/v1/platforms/meta/campaigns', { params })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = data as any
  // Normalize: backend puede devolver 'name'/'id' o 'campaign_name'/'campaign_id'
  const rawList: any[] = Array.isArray(raw) ? raw : (raw.campaigns ?? [])
  const campaigns: MetaCampaign[] = rawList.map((c: any) => ({
    ...c,
    campaign_id:   c.campaign_id   ?? c.id   ?? "",
    campaign_name: c.campaign_name ?? c.name ?? "",
  }))
  return {
    campaigns,
    total:      raw.total,
    adAccountId: raw.adAccountId ?? params.adAccountId ?? "",
    dateRange:  raw.dateRange ?? { since: params.since ?? "", until: params.until ?? "" },
  }
}

// ── Anuncios ────────────────────────────────────────────────────────────────────
// GET /v1/platforms/meta/campaigns/:campaignId/ads?clientId=...&adAccountId=...&since=...&until=...

export interface MetaAdCreative {
  thumbnail_url?: string
  image_url?: string
  video_url?: string
  body?: string
  title?: string
  cards?: Array<{
    thumbnail_url?: string
    image_url?: string
    title?: string
    description?: string
  }>
}

export interface MetaAd {
  id: string
  name: string
  status?: string
  format?: string
  creative?: MetaAdCreative
  spend?: number
  impressions?: number
  clicks?: number
  ctr?: number
  conversions?: number
  roas?: number | null
  revenue?: number
  cpa?: number | null
}

export interface MetaAdsResponse {
  ads: MetaAd[]
  total?: number
  campaignId: string
  campaignName?: string
}

export const getMetaAds = async (params: {
  campaignId: string
  clientId: string
  adAccountId?: string
  since?: string
  until?: string
}): Promise<MetaAdsResponse> => {
  const { campaignId, ...queryParams } = params
  const { data } = await apiClient.get(
    `/v1/platforms/meta/campaigns/${campaignId}/ads`,
    { params: queryParams }
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = data as any
  const rawList: any[] = Array.isArray(raw) ? raw : (raw.ads ?? raw.data ?? [])
  const ads: MetaAd[] = rawList.map((a: any) => ({
    ...a,
    id:   a.id   ?? a.ad_id   ?? "",
    name: a.name ?? a.ad_name ?? "",
  }))
  return {
    ads,
    total:        raw.total,
    campaignId:   raw.campaignId   ?? campaignId,
    campaignName: raw.campaignName ?? "",
  }
}

/**
 * POST /v1/platforms/meta/connect-link
 * Devuelve la URL de OAuth para iniciar la conexión con Meta.
 * @param clientId  ID de la empresa interna seleccionada
 * @param redirectUri  URL de retorno (opcional; el backend usa FRONTEND_URL si no se envía)
 */
export const getMetaConnectLink = async (
  clientId: string,
  redirectUri?: string
): Promise<MetaConnectLinkResponse> => {
  const body: Record<string, string> = { clientId }
  if (redirectUri) body.redirectUri = redirectUri
  const { data } = await apiClient.post('/v1/platforms/meta/connect-link', body)
  return data as MetaConnectLinkResponse
}

/**
 * POST /v1/platforms/meta/sync-accounts
 * Sincroniza las cuentas publicitarias de Meta para la empresa dada.
 * @param clientId  ID de la empresa interna seleccionada
 */
export const syncMetaAccounts = async (
  clientId: string
): Promise<MetaSyncAccountsResponse> => {
  const { data } = await apiClient.post('/v1/platforms/meta/sync-accounts', { clientId })
  return data as MetaSyncAccountsResponse
}
