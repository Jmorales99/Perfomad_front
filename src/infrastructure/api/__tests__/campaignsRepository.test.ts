import { describe, it, expect, vi, beforeEach } from "vitest"

// vi.mock is hoisted, so factories must not reference variables declared outside
vi.mock("@/infrastructure/api/client", () => {
  const mockGet = vi.fn().mockResolvedValue({ data: {} })
  const mockPost = vi.fn()
  return {
    apiClient: { get: mockGet, post: mockPost },
  }
})

import { apiClient } from "@/infrastructure/api/client"
import {
  getDashboardMetrics,
  getCampaigns,
  getDashboardSalesHistory,
} from "../campaignsRepository"

const mockGet = vi.mocked(apiClient.get)

describe("campaignsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: {} })
  })

  describe("getDashboardMetrics", () => {
    it("calls /v1/dashboard/metrics without params when no clientId", async () => {
      await getDashboardMetrics()
      expect(mockGet).toHaveBeenCalledWith("/v1/dashboard/metrics", { params: undefined })
    })

    it("passes client_id as query param when clientId provided", async () => {
      await getDashboardMetrics("client-abc")
      expect(mockGet).toHaveBeenCalledWith("/v1/dashboard/metrics", {
        params: { client_id: "client-abc" },
      })
    })

    it("does not pass client_id when clientId is null", async () => {
      await getDashboardMetrics(null)
      expect(mockGet).toHaveBeenCalledWith("/v1/dashboard/metrics", { params: undefined })
    })
  })

  describe("getCampaigns", () => {
    it("calls /v1/campaigns without params when no clientId", async () => {
      mockGet.mockResolvedValue({ data: [] })
      await getCampaigns()
      expect(mockGet).toHaveBeenCalledWith("/v1/campaigns", { params: undefined })
    })

    it("passes client_id as query param when clientId provided", async () => {
      mockGet.mockResolvedValue({ data: [] })
      await getCampaigns("client-xyz")
      expect(mockGet).toHaveBeenCalledWith("/v1/campaigns", {
        params: { client_id: "client-xyz" },
      })
    })
  })

  describe("getDashboardSalesHistory", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue({ data: { data: [], improvement: null, period_days: 30 } })
    })

    it("sends days as string param", async () => {
      await getDashboardSalesHistory(30)
      const call = mockGet.mock.calls[0]
      expect(call[0]).toBe("/v1/dashboard/sales-history")
      expect(call[1].params.days).toBe("30")
    })

    it("includes campaign_ids as comma-separated string", async () => {
      await getDashboardSalesHistory(30, ["id-1", "id-2"])
      const call = mockGet.mock.calls[0]
      expect(call[1].params.campaign_ids).toBe("id-1,id-2")
    })

    it("includes platforms as comma-separated string", async () => {
      await getDashboardSalesHistory(30, undefined, ["meta", "google_ads"])
      const call = mockGet.mock.calls[0]
      expect(call[1].params.platforms).toBe("meta,google_ads")
    })

    it("includes client_id when provided", async () => {
      await getDashboardSalesHistory(30, undefined, undefined, "client-1")
      const call = mockGet.mock.calls[0]
      expect(call[1].params.client_id).toBe("client-1")
    })

    it("does not include client_id when absent", async () => {
      await getDashboardSalesHistory(30)
      const call = mockGet.mock.calls[0]
      expect(call[1].params.client_id).toBeUndefined()
    })
  })
})
