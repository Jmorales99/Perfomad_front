import { describe, it, expect } from "vitest"
import type { CampaignDTO } from "@/infrastructure/api/campaignsRepository"

// ── Pure helper functions extracted from HomePage ─────────────────────────────
// These mirror the useMemo logic inside the component, tested in isolation.

function computeROA(campaigns: CampaignDTO[]): number | null {
  let totalSpend = 0
  let totalRevenue = 0

  campaigns.forEach((c) => {
    if (c.mock_stats) {
      totalSpend += c.mock_stats.spend || c.spend_usd || 0
      totalRevenue += c.mock_stats.total_sales || c.mock_stats.revenue || 0
    } else {
      totalSpend += c.spend_usd || 0
    }
  })

  return totalSpend > 0 ? totalRevenue / totalSpend : null
}

function buildActiveMetrics(
  activePlatformTab: "all" | string,
  metrics: any,
  platformsSummary: any,
  avgROA: number | null
) {
  if (!metrics && !platformsSummary) return null

  if (activePlatformTab === "all") {
    return {
      total_campaigns: metrics?.summary.total_campaigns ?? 0,
      active_campaigns: metrics?.summary.active_campaigns ?? 0,
      total_spend: metrics?.summary.total_spend ?? 0,
      total_budget: metrics?.summary.total_budget ?? 0,
      average_ctr: metrics?.metrics.average_ctr ?? 0,
      total_clicks: metrics?.metrics.total_clicks ?? 0,
      roa: avgROA,
    }
  }

  const platform = platformsSummary?.platforms?.find((p: any) => p.platform === activePlatformTab)
  if (!platform) return null

  return {
    total_campaigns: platform.total_campaigns,
    active_campaigns: platform.active_campaigns,
    total_spend: platform.metrics.spend ?? 0,
    total_budget: 0,
    average_ctr: platform.metrics.ctr ?? 0,
    total_clicks: platform.metrics.clicks ?? 0,
    roa: platform.metrics.roa ?? null,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("computeROA", () => {
  it("returns null when there are no campaigns", () => {
    expect(computeROA([])).toBeNull()
  })

  it("returns null when total spend is zero", () => {
    const campaigns = [
      { spend_usd: 0, mock_stats: undefined } as unknown as CampaignDTO,
    ]
    expect(computeROA(campaigns)).toBeNull()
  })

  it("calculates ROA from mock_stats.total_sales / spend", () => {
    const campaigns = [
      {
        spend_usd: 0,
        mock_stats: { spend: 100, total_sales: 500, impressions: 0, clicks: 0, ctr: 0 },
      } as CampaignDTO,
    ]
    expect(computeROA(campaigns)).toBe(5)
  })

  it("falls back to mock_stats.revenue when total_sales absent", () => {
    const campaigns = [
      {
        spend_usd: 0,
        mock_stats: { spend: 200, revenue: 600, impressions: 0, clicks: 0, ctr: 0 },
      } as CampaignDTO,
    ]
    expect(computeROA(campaigns)).toBe(3)
  })

  it("uses spend_usd when mock_stats is absent", () => {
    const campaigns = [
      { spend_usd: 100, mock_stats: undefined } as unknown as CampaignDTO,
    ]
    // revenue = 0, spend = 100 → ROA = 0/100 = 0 (not null because spend > 0)
    expect(computeROA(campaigns)).toBe(0)
  })

  it("aggregates across multiple campaigns", () => {
    const campaigns: CampaignDTO[] = [
      {
        spend_usd: 0,
        mock_stats: { spend: 100, total_sales: 300, impressions: 0, clicks: 0, ctr: 0 },
      } as CampaignDTO,
      {
        spend_usd: 0,
        mock_stats: { spend: 100, total_sales: 200, impressions: 0, clicks: 0, ctr: 0 },
      } as CampaignDTO,
    ]
    // (300 + 200) / (100 + 100) = 2.5
    expect(computeROA(campaigns)).toBe(2.5)
  })
})

describe("buildActiveMetrics", () => {
  const mockMetrics = {
    summary: { total_campaigns: 5, active_campaigns: 3, total_spend: 500, total_budget: 2000 },
    metrics: { average_ctr: 2.5, total_clicks: 1200 },
  }

  const mockPlatformsSummary = {
    platforms: [
      {
        platform: "meta",
        total_campaigns: 3,
        active_campaigns: 2,
        metrics: { spend: 300, ctr: 3.0, clicks: 800, roa: 4.5 },
      },
      {
        platform: "google_ads",
        total_campaigns: 2,
        active_campaigns: 1,
        metrics: { spend: 200, ctr: 2.0, clicks: 400, roa: 2.0 },
      },
    ],
  }

  it("returns aggregated metrics when tab is 'all'", () => {
    const result = buildActiveMetrics("all", mockMetrics, mockPlatformsSummary, 3.5)
    expect(result?.total_campaigns).toBe(5)
    expect(result?.total_spend).toBe(500)
    expect(result?.average_ctr).toBe(2.5)
    expect(result?.roa).toBe(3.5)
  })

  it("returns platform-specific metrics when a platform tab is selected", () => {
    const result = buildActiveMetrics("meta", mockMetrics, mockPlatformsSummary, 3.5)
    expect(result?.total_campaigns).toBe(3)
    expect(result?.total_spend).toBe(300)
    expect(result?.average_ctr).toBe(3.0)
    expect(result?.roa).toBe(4.5)
  })

  it("returns null when platform tab is selected but platform not found", () => {
    const result = buildActiveMetrics("tiktok", mockMetrics, mockPlatformsSummary, 3.5)
    expect(result).toBeNull()
  })

  it("returns null when both metrics and platformsSummary are null", () => {
    const result = buildActiveMetrics("all", null, null, null)
    expect(result).toBeNull()
  })

  it("shows zero values when metrics are missing fields", () => {
    const partialMetrics = {
      summary: { total_campaigns: 0, active_campaigns: 0, total_spend: 0, total_budget: 0 },
      metrics: { average_ctr: 0, total_clicks: 0 },
    }
    const result = buildActiveMetrics("all", partialMetrics, null, null)
    expect(result?.roa).toBeNull()
    expect(result?.total_spend).toBe(0)
  })
})
