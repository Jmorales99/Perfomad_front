import { useState, useEffect } from "react"
import {
  getPlatformsSummary,
  getPlatformMetrics,
  getPlatformInsights,
  getDashboardPlatformSummary,
  type PlatformsSummaryResponse,
  type PlatformMetricsResponse,
  type PlatformInsightsResponse,
  type DashboardPlatformSummary,
  type Platform,
} from "@/infrastructure/api/platformRepository"

// Hook para obtener resumen de todas las plataformas
export function usePlatformsSummary() {
  const [data, setData] = useState<PlatformsSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const summary = await getPlatformsSummary()
        setData(summary)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const refetch = async () => {
    try {
      setLoading(true)
      const summary = await getPlatformsSummary()
      setData(summary)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch }
}

// Hook para obtener métricas de una plataforma específica
export function usePlatformMetrics(platform: Platform) {
  const [data, setData] = useState<PlatformMetricsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!platform) return

      try {
        setLoading(true)
        const metrics = await getPlatformMetrics(platform)
        setData(metrics)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [platform])

  const refetch = async () => {
    if (!platform) return

    try {
      setLoading(true)
      const metrics = await getPlatformMetrics(platform)
      setData(metrics)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch }
}

// Hook para obtener insights de una plataforma específica
export function usePlatformInsights(platform: Platform) {
  const [data, setData] = useState<PlatformInsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!platform) return

      try {
        setLoading(true)
        const insights = await getPlatformInsights(platform)
        setData(insights)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [platform])

  const refetch = async () => {
    if (!platform) return

    try {
      setLoading(true)
      const insights = await getPlatformInsights(platform)
      setData(insights)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch }
}

// Hook para obtener resumen de plataformas del dashboard (filtra por client si se proporciona)
export function useDashboardPlatformSummary(clientId?: string | null) {
  const [data, setData] = useState<DashboardPlatformSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const summary = await getDashboardPlatformSummary(clientId)
        setData(summary)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId])

  const refetch = async () => {
    try {
      setLoading(true)
      const summary = await getDashboardPlatformSummary(clientId)
      setData(summary)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch }
}

