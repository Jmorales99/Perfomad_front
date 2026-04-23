import {
  getMetaAdAccounts,
  getMetaMetrics,
  getMetaCampaigns,
  getMetaConnectLink,
  syncMetaAccounts,
} from "@/infrastructure/repositories/integrations/metaRepository"
import {
  getGoogleAdsAdAccounts,
  getGoogleAdsMetrics,
  getGoogleAdsCampaigns,
  getGoogleAdsConnectLink,
  syncGoogleAdsAccounts,
} from "@/infrastructure/repositories/integrations/googleAdsRepository"
import {
  getTikTokAccounts,
  getTikTokConnectLink,
  listTikTokAdvertisers,
} from "@/infrastructure/repositories/integrations/tiktokRepository"
import {
  getPlatformAccountMetrics,
  type PlatformAccountMetricsApiResponse,
} from "@/infrastructure/api/platformRepository"
import type { NormalizedCampaignRow } from "./GenericCampaignsTable"
import type { NormalizedMetrics } from "./PlatformKpis"

export type PlatformKey = "meta" | "google_ads" | "tiktok" | "linkedin"

export interface PlatformAdAccount {
  id: string
  platform_account_id: string
  account_name: string | null
  currency?: string
  is_active: boolean
}

export interface MetricsQuery {
  clientId: string
  adAccountId: string
  since: string
  until: string
}

export interface CampaignsQuery {
  clientId: string
  adAccountId: string
  since: string
  until: string
}

export interface NormalizedMetricsResponse {
  currency: string
  accountName?: string
  metrics: NormalizedMetrics
}

export interface NormalizedCampaignsResponse {
  campaigns: NormalizedCampaignRow[]
}

export interface PlatformAdapter {
  key: PlatformKey
  title: string
  subtitle: string
  brandName?: string
  /** 'meta' / 'google_ads' used in backend paths for the unified endpoint */
  backendKey: "meta" | "google_ads" | "tiktok" | "linkedin"
  listAccounts: (clientId: string) => Promise<PlatformAdAccount[]>
  getMetrics: (q: MetricsQuery) => Promise<NormalizedMetricsResponse>
  getCampaigns?: (q: CampaignsQuery) => Promise<NormalizedCampaignsResponse>
  getConnectLink?: (clientId: string) => Promise<{ url: string }>
  syncAccounts?: (clientId: string) => Promise<unknown>
  /** Supports creative/ads hierarchy modal */
  supportsAdsHierarchy: boolean
  /** Supports mutations (pause/resume/budget) via AI */
  supportsMutations: boolean
  /**
   * Whether the "Optimize with AI" action is available for campaigns
   * listed on this platform's page. When true, the table shows a Sparkles
   * button that imports the campaign and navigates to /optimize/:uuid.
   */
  supportsOptimization: boolean
}

function toNormalizedMetrics(res: PlatformAccountMetricsApiResponse): NormalizedMetricsResponse {
  return {
    currency: res.currency ?? "USD",
    accountName: res.accountName,
    metrics: {
      spend: res.metrics.spend ?? null,
      impressions: res.metrics.impressions ?? null,
      clicks: res.metrics.clicks ?? null,
      reach: res.metrics.reach ?? null,
      ctr: res.metrics.ctr ?? null,
      cpc: res.metrics.cpc ?? null,
      cpm: res.metrics.cpm ?? null,
      conversions: res.metrics.conversions ?? null,
      revenue: res.metrics.revenue ?? null,
      roas: res.metrics.roas ?? null,
      cpa: res.metrics.cpa ?? null,
    },
  }
}

export const PLATFORM_ADAPTERS: Record<PlatformKey, PlatformAdapter> = {
  meta: {
    key: "meta",
    title: "Meta Ads",
    subtitle: "Facebook & Instagram",
    brandName: "Meta",
    backendKey: "meta",
    supportsAdsHierarchy: true,
    supportsMutations: true,
    supportsOptimization: true,
    listAccounts: async (clientId) => {
      const accs = await getMetaAdAccounts(clientId)
      return accs.map((a) => ({
        id: a.id,
        platform_account_id: a.platform_account_id,
        account_name: a.account_name,
        currency: a.currency,
        is_active: a.is_active,
      }))
    },
    getMetrics: async (q) => {
      const res = await getMetaMetrics(q)
      return {
        currency: res.currency ?? "USD",
        accountName: res.accountName,
        metrics: {
          spend: res.metrics.spend ?? null,
          impressions: res.metrics.impressions ?? null,
          clicks: res.metrics.clicks ?? null,
          reach: res.metrics.reach ?? null,
          ctr: res.metrics.ctr ?? null,
          cpc: res.metrics.cpc ?? null,
          cpm: res.metrics.cpm ?? null,
          conversions: res.metrics.conversions ?? null,
          revenue: res.metrics.revenue ?? null,
          roas: res.metrics.roas ?? null,
          cpa: res.metrics.cpa ?? null,
        },
      }
    },
    getCampaigns: async (q) => {
      const res = await getMetaCampaigns(q)
      return {
        campaigns: res.campaigns.map((c) => ({
          campaign_id: c.campaign_id,
          campaign_name: c.campaign_name,
          status: c.status,
          spend: c.spend,
          impressions: c.impressions,
          clicks: c.clicks,
          ctr: c.ctr,
          cpc: c.cpc,
          cpm: c.cpm,
          conversions: c.conversions,
          roas: c.roas,
          revenue: c.revenue,
        })),
      }
    },
    getConnectLink: (clientId) => getMetaConnectLink(clientId),
    syncAccounts: (clientId) => syncMetaAccounts(clientId),
  },

  google_ads: {
    key: "google_ads",
    title: "Google Ads",
    subtitle: "Búsqueda, Display, YouTube",
    brandName: "Google",
    backendKey: "google_ads",
    supportsAdsHierarchy: true,
    supportsMutations: true,
    supportsOptimization: true,
    listAccounts: async (clientId) => {
      const accs = await getGoogleAdsAdAccounts(clientId)
      return accs.map((a) => ({
        id: a.id,
        platform_account_id: a.platform_account_id,
        account_name: a.account_name,
        currency: a.currency,
        is_active: a.is_active,
      }))
    },
    getMetrics: async (q) => {
      const res = await getGoogleAdsMetrics(q)
      return {
        currency: res.currency ?? "USD",
        accountName: res.accountName,
        metrics: {
          spend: res.metrics.spend ?? null,
          impressions: res.metrics.impressions ?? null,
          clicks: res.metrics.clicks ?? null,
          reach: null,
          ctr: res.metrics.ctr ?? null,
          cpc: res.metrics.cpc ?? null,
          cpm: res.metrics.cpm ?? null,
          conversions: res.metrics.conversions ?? null,
          revenue: res.metrics.revenue ?? null,
          roas: res.metrics.roas ?? null,
          cpa: res.metrics.cpa ?? null,
        },
      }
    },
    getCampaigns: async (q) => {
      const res = await getGoogleAdsCampaigns(q)
      return {
        campaigns: res.campaigns.map((c) => ({
          campaign_id: c.campaign_id,
          campaign_name: c.campaign_name,
          status: c.status,
          spend: c.spend,
          impressions: c.impressions,
          clicks: c.clicks,
          ctr: c.ctr,
          cpc: c.cpc,
          cpm: c.cpm,
          conversions: c.conversions,
          roas: c.roas,
          revenue: c.revenue,
        })),
      }
    },
    getConnectLink: (clientId) => getGoogleAdsConnectLink(clientId),
    syncAccounts: (clientId) => syncGoogleAdsAccounts(clientId),
  },

  tiktok: {
    key: "tiktok",
    title: "TikTok Ads",
    subtitle: "Lectura únicamente (no ejecuta cambios)",
    brandName: "TikTok",
    backendKey: "tiktok",
    supportsAdsHierarchy: false,
    supportsMutations: false,
    supportsOptimization: false,
    listAccounts: async (clientId) => {
      const accs = await getTikTokAccounts(clientId)
      return accs.map((a) => ({
        id: a.id,
        platform_account_id: a.platform_account_id,
        account_name: a.account_name,
        currency: a.currency,
        is_active: a.is_active,
      }))
    },
    getMetrics: async (q) => {
      const res = await getPlatformAccountMetrics("tiktok", q)
      return toNormalizedMetrics(res)
    },
    getConnectLink: (clientId) => getTikTokConnectLink(clientId),
    syncAccounts: (clientId) => listTikTokAdvertisers(clientId),
  },

  linkedin: {
    key: "linkedin",
    title: "LinkedIn Ads",
    subtitle: "Métricas e insights",
    brandName: "LinkedIn",
    backendKey: "linkedin",
    supportsAdsHierarchy: false,
    supportsMutations: false,
    supportsOptimization: false,
    listAccounts: async () => [],
    getMetrics: async (q) => {
      const res = await getPlatformAccountMetrics("linkedin", q)
      return toNormalizedMetrics(res)
    },
  },
}

export function getPlatformAdapter(key: string): PlatformAdapter | null {
  if (!key) return null
  const normalized = key === "google-ads" ? "google_ads" : key
  return (PLATFORM_ADAPTERS as Record<string, PlatformAdapter>)[normalized] ?? null
}

export function platformUrlSlug(key: PlatformKey): string {
  return key === "google_ads" ? "google-ads" : key
}
