import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock the axios apiClient ──────────────────────────────────────────────────
vi.mock("../client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { apiClient } from "../client"
import { getConsolidatedDashboard, syncDashboard } from "../dashboardRepository"
import type { ConsolidatedDashboardResult } from "../dashboardRepository"

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeResult(overrides: Partial<ConsolidatedDashboardResult> = {}): ConsolidatedDashboardResult {
  return {
    needs_sync: false,
    last_synced_at: "2024-03-01T10:00:00Z",
    totals: {
      spend: 500,
      impressions: 10000,
      clicks: 300,
      conversions: 15,
      revenue: 2000,
      ctr: 3.0,
      cpc: 1.67,
      cpm: 50,
      roa: 4.0,
    },
    platforms: [],
    campaigns: [],
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("dashboardRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getConsolidatedDashboard", () => {
    it("calls GET /v1/dashboard/consolidated with client_id", async () => {
      const mockData = makeResult()
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData })

      const result = await getConsolidatedDashboard("client-123")

      expect(apiClient.get).toHaveBeenCalledWith(
        "/v1/dashboard/consolidated",
        { params: { client_id: "client-123" } }
      )
      expect(result).toEqual(mockData)
    })

    it("passes platform filter when provided", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: makeResult() })

      await getConsolidatedDashboard("client-123", "meta")

      expect(apiClient.get).toHaveBeenCalledWith(
        "/v1/dashboard/consolidated",
        { params: { client_id: "client-123", platform: "meta" } }
      )
    })

    it("does not include platform param when not provided", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: makeResult() })

      await getConsolidatedDashboard("client-xyz")

      const callParams = vi.mocked(apiClient.get).mock.calls[0][1]?.params
      expect(callParams).not.toHaveProperty("platform")
    })

    it("returns needs_sync=true when backend says so", async () => {
      const neverSynced = makeResult({ needs_sync: true, last_synced_at: null })
      vi.mocked(apiClient.get).mockResolvedValue({ data: neverSynced })

      const result = await getConsolidatedDashboard("client-abc")

      expect(result.needs_sync).toBe(true)
      expect(result.last_synced_at).toBeNull()
    })
  })

  describe("syncDashboard", () => {
    it("calls POST /v1/dashboard/sync with client_id", async () => {
      const freshData = makeResult()
      vi.mocked(apiClient.post).mockResolvedValue({ data: freshData })

      const result = await syncDashboard("client-456")

      expect(apiClient.post).toHaveBeenCalledWith(
        "/v1/dashboard/sync",
        { client_id: "client-456" }
      )
      expect(result).toEqual(freshData)
    })

    it("includes dateRange when provided", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: makeResult() })

      await syncDashboard("client-456", { since: "2024-01-01", until: "2024-01-31" })

      expect(apiClient.post).toHaveBeenCalledWith(
        "/v1/dashboard/sync",
        { client_id: "client-456", since: "2024-01-01", until: "2024-01-31" }
      )
    })

    it("does not include since/until when dateRange is not provided", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: makeResult() })

      await syncDashboard("client-789")

      const body = vi.mocked(apiClient.post).mock.calls[0][1] as Record<string, unknown>
      expect(body).not.toHaveProperty("since")
      expect(body).not.toHaveProperty("until")
    })
  })
})
