import { useNavigate } from "react-router-dom"
import { useEffect, useState, useMemo, useCallback } from "react"
import { getProfile } from "@/infrastructure/api/profileRepository"
import { getDashboardMetrics, getCampaigns, getDashboardSalesHistory, type CampaignDTO, type SalesHistoryResponse, type Platform } from "@/infrastructure/api/campaignsRepository"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Megaphone, Rocket, ImageIcon, Settings, Link2, ArrowRight, TrendingUp, DollarSign, MousePointerClick, Eye, Calendar, X, Filter } from "lucide-react"
import { SubscriptionBanner } from "@/components/SubscriptionBanner"
import { SalesChart } from "@/components/SalesChart"

interface DashboardMetrics {
  summary: {
    total_campaigns: number
    active_campaigns: number
    paused_campaigns: number
    completed_campaigns: number
    total_spend: number
    total_budget: number
    budget_utilization: number
  }
  metrics: {
    total_impressions: number
    total_clicks: number
    total_conversions: number
    average_ctr: number
    average_cpc: number
    average_cpm: number
  }
  recent_campaigns: Array<{
    id: string
    name: string
    status: string
    platforms: string[]
    spend_usd: number
    budget_usd: number
    created_at: string
  }>
  platform_distribution: Record<string, number>
}

export default function HomePage() {
  const navigate = useNavigate()
  const [name, setName] = useState<string>("")
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignDTO[]>([])
  const [salesHistory, setSalesHistory] = useState<SalesHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Date filter state for sales chart
  const [customStartDate, setCustomStartDate] = useState<string>("")
  const [customEndDate, setCustomEndDate] = useState<string>("")
  const [daysFilter, setDaysFilter] = useState<number>(30) // Default 30 days
  
  // Campaign and platform filter state for sales chart
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])

  // Fetch sales history with date filter (memoized)
  const fetchSalesHistory = useCallback(async () => {
    try {
      let historyData: SalesHistoryResponse | null = null
      
      let days = daysFilter
      if (customStartDate && customEndDate) {
        // Calculate days between dates
        const start = new Date(customStartDate)
        const end = new Date(customEndDate)
        days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      }
      
      // Get campaign IDs and platforms for filtering
      const campaignIds = selectedCampaignIds.length > 0 ? selectedCampaignIds : undefined
      const platforms = selectedPlatforms.length > 0 ? selectedPlatforms : undefined
      
      historyData = await getDashboardSalesHistory(days, campaignIds, platforms).catch(() => null)
      
      setSalesHistory(historyData)
    } catch (err) {
      console.error("Error al obtener historial de ventas:", err)
    }
  }, [daysFilter, customStartDate, customEndDate, selectedCampaignIds, selectedPlatforms])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profile, dashboardData, campaignsData] = await Promise.all([
          getProfile(),
          getDashboardMetrics(),
          getCampaigns(),
        ])
        setName(profile.name)
        setMetrics(dashboardData)
        setCampaigns(campaignsData) // Store all campaigns for filtering
      } catch (err) {
        console.error("Error al obtener datos:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Debounce fetchSalesHistory to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSalesHistory()
    }, 300) // Wait 300ms after user stops changing filters

    return () => clearTimeout(timer)
  }, [fetchSalesHistory])
  
  // Get unique campaign names for filter (memoized)
  const getUniqueCampaignNames = useMemo(() => {
    return campaigns.map((c) => ({ id: c.id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [campaigns])
  
  // Memoize CPA and ROA calculations
  const { avgCPA, avgROA } = useMemo(() => {
    let totalSpend = 0
    let totalRevenue = 0
    let totalConversions = 0
    
    campaigns.forEach((c) => {
      if (c.mock_stats) {
        totalSpend += c.mock_stats.spend || c.spend_usd || 0
        totalRevenue += c.mock_stats.total_sales || c.mock_stats.revenue || 0
        totalConversions += c.mock_stats.conversions || 0
      } else {
        totalSpend += c.spend_usd || 0
      }
    })
    
    const cpa = totalConversions > 0 ? totalSpend / totalConversions : null
    const roa = totalSpend > 0 ? totalRevenue / totalSpend : null
    
    return { avgCPA: cpa, avgROA: roa }
  }, [campaigns])
  
  const platformLabels: Record<Platform, string> = {
    meta: "Meta",
    google_ads: "Google Ads",
    linkedin: "LinkedIn",
  }
  
  // Handle start date change - auto-set end date if not set
  const handleStartDateChange = (date: string) => {
    setCustomStartDate(date)
    setDaysFilter(0) // Reset days filter when using custom dates
    // If end date is not set or is before the new start date, set it to today
    if (!customEndDate || new Date(date) > new Date(customEndDate)) {
      setCustomEndDate(new Date().toISOString().split('T')[0])
    }
  }
  
  // Handle custom date range apply
  const handleApplyCustomDateRange = () => {
    if (!customStartDate) {
      alert("Por favor, selecciona una fecha de inicio")
      return
    }
    
    // Auto-fill end date with today if not selected
    const endDate = customEndDate || new Date().toISOString().split('T')[0]
    
    if (new Date(customStartDate) > new Date(endDate)) {
      alert("La fecha de inicio debe ser anterior a la fecha de fin")
      return
    }
    
    setDaysFilter(0) // Use custom dates
  }
  
  // Get formatted date range text for display
  const getDateRangeText = (): string | null => {
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
      const end = new Date(customEndDate).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
      return `${start} - ${end}`
    }
    return null
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    completed: "bg-gray-100 text-gray-700",
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 🧩 Banner de suscripción */}
        <SubscriptionBanner />

        <h2 className="text-4xl font-extrabold mb-3 text-blue-800 drop-shadow-sm">
          ¡Bienvenido, <span className="text-blue-600">{name || "usuario"}</span>! 🎯
        </h2>
        <p className="text-gray-600 mb-8 text-lg">
          Resumen de tus campañas y métricas de rendimiento
        </p>

        {loading ? (
          <div className="text-center py-12">Cargando datos...</div>
        ) : (
          <>
            {/* Quick Actions - At the Top */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate("/campaigns")}
              >
                <CardContent className="p-4 text-center">
                  <Megaphone className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-medium">Campañas</p>
                </CardContent>
              </Card>
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate("/images")}
              >
                <CardContent className="p-4 text-center">
                  <ImageIcon className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-medium">Imágenes</p>
                </CardContent>
              </Card>
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate("/settings")}
              >
                <CardContent className="p-4 text-center">
                  <Settings className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-medium">Configuración</p>
                </CardContent>
              </Card>
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate("/settings?tab=integrations")}
              >
                <CardContent className="p-4 text-center">
                  <Link2 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-medium">Integraciones</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Metrics and Charts (3 columns) */}
              <div className="lg:col-span-3 space-y-6">
                {/* Summary Cards */}
                {metrics && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Total Campañas</p>
                              <p className="text-2xl font-bold text-blue-600">{metrics.summary.total_campaigns}</p>
                            </div>
                            <Megaphone className="w-8 h-8 text-blue-400" />
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {metrics.summary.active_campaigns} activas
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Gasto Total</p>
                              <p className="text-2xl font-bold text-green-600">
                                ${metrics.summary.total_spend.toFixed(2)}
                              </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-400" />
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            de ${metrics.summary.total_budget.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">CTR Promedio</p>
                              <p className="text-2xl font-bold text-purple-600">
                                {metrics.metrics.average_ctr.toFixed(2)}%
                              </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-purple-400" />
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {metrics.metrics.total_clicks.toLocaleString()} clics
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Impresiones</p>
                              <p className="text-2xl font-bold text-orange-600">
                                {metrics.metrics.total_impressions.toLocaleString()}
                              </p>
                            </div>
                            <Eye className="w-8 h-8 text-orange-400" />
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {metrics.metrics.total_clicks.toLocaleString()} clics
                          </div>
                        </CardContent>
                      </Card>

                      {/* CPA Card */}
                      {avgCPA !== null && (
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">CPA</p>
                                <p className="text-2xl font-bold text-red-600">
                                  ${avgCPA.toFixed(2)}
                                </p>
                              </div>
                              <DollarSign className="w-8 h-8 text-red-400" />
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Cost Per Acquisition
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* ROA Card */}
                      {avgROA !== null && (
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">ROA</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {avgROA.toFixed(2)}x
                                </p>
                              </div>
                              <TrendingUp className="w-8 h-8 text-green-400" />
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Return on Ad Spend
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Sales History Chart with Filter */}
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <CardTitle>Historial de Ventas Total</CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Campaign Names Filter */}
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Filter className="w-4 h-4" />
                                  Campañas
                                  {selectedCampaignIds.length > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                      {selectedCampaignIds.length}
                                    </Badge>
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent 
                                align="end" 
                                className="w-64 max-h-96 overflow-y-auto"
                                onCloseAutoFocus={(e) => e.preventDefault()}
                              >
                                <DropdownMenuLabel>Campañas</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {getUniqueCampaignNames.map((campaign) => (
                                  <DropdownMenuCheckboxItem
                                    key={campaign.id}
                                    checked={selectedCampaignIds.includes(campaign.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedCampaignIds([...selectedCampaignIds, campaign.id])
                                      } else {
                                        setSelectedCampaignIds(selectedCampaignIds.filter((id) => id !== campaign.id))
                                      }
                                    }}
                                    onSelect={(e) => {
                                      e.preventDefault()
                                    }}
                                  >
                                    {campaign.name}
                                  </DropdownMenuCheckboxItem>
                                ))}
                                {selectedCampaignIds.length > 0 && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.preventDefault()
                                        setSelectedCampaignIds([])
                                      }}
                                      onSelect={(e) => {
                                        e.preventDefault()
                                      }}
                                      className="text-red-600"
                                    >
                                      Limpiar selección
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            
                            {/* Platform Filter */}
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Filter className="w-4 h-4" />
                                  Plataformas
                                  {selectedPlatforms.length > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                      {selectedPlatforms.length}
                                    </Badge>
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent 
                                align="end" 
                                className="w-48"
                                onCloseAutoFocus={(e) => e.preventDefault()}
                              >
                                <DropdownMenuLabel>Plataformas</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {(["meta", "google_ads", "linkedin"] as Platform[]).map((platform) => (
                                  <DropdownMenuCheckboxItem
                                    key={platform}
                                    checked={selectedPlatforms.includes(platform)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedPlatforms([...selectedPlatforms, platform])
                                      } else {
                                        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform))
                                      }
                                    }}
                                    onSelect={(e) => {
                                      e.preventDefault()
                                    }}
                                  >
                                    {platformLabels[platform]}
                                  </DropdownMenuCheckboxItem>
                                ))}
                                {selectedPlatforms.length > 0 && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.preventDefault()
                                        setSelectedPlatforms([])
                                      }}
                                      onSelect={(e) => {
                                        e.preventDefault()
                                      }}
                                      className="text-red-600"
                                    >
                                      Limpiar selección
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            
                            {/* Date Filter */}
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Calendar className="w-4 h-4" />
                                  Fecha
                                  {(customStartDate && customEndDate) && (
                                    <Badge variant="secondary" className="ml-1">
                                      ✓
                                    </Badge>
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align="end" 
                              className="w-64"
                              onCloseAutoFocus={(e) => e.preventDefault()}
                            >
                              <DropdownMenuLabel>Filtrar por fecha</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <div className="p-2 space-y-3">
                                {/* Quick Filters */}
                                <div className="space-y-1">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setDaysFilter(7)
                                      setCustomStartDate("")
                                      setCustomEndDate("")
                                    }}
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    Últimos 7 días
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setDaysFilter(30)
                                      setCustomStartDate("")
                                      setCustomEndDate("")
                                    }}
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    Últimos 30 días
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setDaysFilter(90)
                                      setCustomStartDate("")
                                      setCustomEndDate("")
                                    }}
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    Últimos 90 días
                                  </DropdownMenuItem>
                                </div>
                                <DropdownMenuSeparator />
                                {/* Custom Date Range Inputs */}
                                <div className="space-y-2">
                                  <div>
                                    <Label htmlFor="start-date" className="text-xs text-gray-600">Desde</Label>
                                    <input
                                      id="start-date"
                                      type="date"
                                      value={customStartDate}
                                      onChange={(e) => handleStartDateChange(e.target.value)}
                                      className="w-full border rounded px-2 py-1.5 text-sm mt-1"
                                      max={new Date().toISOString().split('T')[0]}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="end-date" className="text-xs text-gray-600">Hasta (opcional)</Label>
                                    <input
                                      id="end-date"
                                      type="date"
                                      value={customEndDate || new Date().toISOString().split('T')[0]}
                                      onChange={(e) => setCustomEndDate(e.target.value)}
                                      className="w-full border rounded px-2 py-1.5 text-sm mt-1"
                                      min={customStartDate || undefined}
                                      max={new Date().toISOString().split('T')[0]}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleApplyCustomDateRange()
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 flex-1"
                                    disabled={!customStartDate}
                                  >
                                    Aplicar
                                  </Button>
                                  {(customStartDate || customEndDate || daysFilter !== 30) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setCustomStartDate("")
                                        setCustomEndDate("")
                                        setDaysFilter(30)
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {(customStartDate && customEndDate) && getDateRangeText() && (
                                <>
                                  <DropdownMenuSeparator />
                                  <div className="px-2 py-1.5">
                                    <div className="text-xs text-gray-500 mb-1">Rango actual:</div>
                                    <div className="text-sm font-medium text-blue-700">
                                      {getDateRangeText()}
                                    </div>
                                  </div>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          {/* Clear All Filters Button */}
                          {(selectedCampaignIds.length > 0 || selectedPlatforms.length > 0 || (customStartDate && customEndDate) || daysFilter !== 30) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCampaignIds([])
                                setSelectedPlatforms([])
                                setCustomStartDate("")
                                setCustomEndDate("")
                                setDaysFilter(30)
                              }}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Limpiar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                      <CardContent>
                        {salesHistory && salesHistory.data && salesHistory.data.length > 0 ? (
                          <div>
                            {/* Chart content without Card wrapper */}
                            <div className="space-y-4">
                              {/* SVG Chart */}
                              <div className="w-full overflow-x-auto">
                                <svg
                                  viewBox="0 0 100 60"
                                  className="w-full h-48 border-b border-l border-gray-200"
                                  preserveAspectRatio="none"
                                >
                                  {/* Grid lines */}
                                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                                    const y = 10 + ratio * 40
                                    return (
                                      <line
                                        key={ratio}
                                        x1={10}
                                        y1={y}
                                        x2={90}
                                        y2={y}
                                        stroke="#e5e7eb"
                                        strokeWidth="0.5"
                                      />
                                    )
                                  })}

                                  {/* Sales line */}
                                  {(() => {
                                    const sorted = [...salesHistory.data].sort((a, b) => 
                                      new Date(a.date).getTime() - new Date(b.date).getTime()
                                    )
                                    const maxSales = Math.max(...sorted.map((d) => d.total_sales), 1)
                                    const minSales = Math.min(...sorted.map((d) => d.total_sales), 0)
                                    const range = maxSales - minSales || 1
                                    
                                    const points = sorted.map((point, index) => {
                                      const x = 10 + (index / (sorted.length - 1 || 1)) * 80
                                      const y = 50 - ((point.total_sales - minSales) / range) * 40
                                      return { x, y, ...point }
                                    })
                                    
                                    const pathData = points
                                      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
                                      .join(" ")
                                    
                                    return (
                                      <>
                                        <path
                                          d={pathData}
                                          fill="none"
                                          stroke="#3b82f6"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                        {points.map((point, index) => (
                                          <circle
                                            key={index}
                                            cx={point.x}
                                            cy={point.y}
                                            r="1.5"
                                            fill="#3b82f6"
                                            className="hover:r-2 transition-all cursor-pointer"
                                          >
                                            <title>
                                              {new Date(point.date).toLocaleDateString('es-CL')}: ${point.total_sales.toFixed(2)}
                                            </title>
                                          </circle>
                                        ))}
                                      </>
                                    )
                                  })()}
                                </svg>
                              </div>

                              {/* Legend and Summary */}
                              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Ventas Totales</p>
                                  <p className="text-lg font-bold text-blue-600">
                                    ${salesHistory.data.reduce((sum, d) => sum + d.total_sales, 0).toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Promedio Diario</p>
                                  <p className="text-lg font-bold text-gray-700">
                                    ${(salesHistory.data.reduce((sum, d) => sum + d.total_sales, 0) / salesHistory.data.length).toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Último Día</p>
                                  <p className="text-lg font-bold text-green-600">
                                    ${salesHistory.data[salesHistory.data.length - 1].total_sales.toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              {/* Timeline labels */}
                              {salesHistory.data.length > 0 && (() => {
                                const sorted = [...salesHistory.data].sort((a, b) => 
                                  new Date(a.date).getTime() - new Date(b.date).getTime()
                                )
                                return (
                                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                                    <span>{new Date(sorted[0].date).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' })}</span>
                                    <span>{new Date(sorted[sorted.length - 1].date).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' })}</span>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            No hay datos de ventas disponibles para el período seleccionado.
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Budget Utilization Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Utilización de Presupuesto</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progreso</span>
                            <span className="font-semibold">{metrics.summary.budget_utilization.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-blue-600 h-4 rounded-full transition-all"
                              style={{ width: `${Math.min(metrics.summary.budget_utilization, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500">
                            ${metrics.summary.total_spend.toFixed(2)} de ${metrics.summary.total_budget.toFixed(2)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Platform Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Distribución por Plataforma</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(metrics.platform_distribution).map(([platform, count]) => (
                            <div key={platform} className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {platformLabels[platform] || platform}
                              </span>
                              <div className="flex items-center gap-2 flex-1 mx-4">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{
                                      width: `${(count / metrics.summary.total_campaigns) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Campaign Status Overview - At the Bottom of Dashboard */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Estado de Campañas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">{metrics.summary.active_campaigns}</div>
                            <div className="text-sm text-gray-600 mt-1">Activas</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-yellow-600">{metrics.summary.paused_campaigns}</div>
                            <div className="text-sm text-gray-600 mt-1">Pausadas</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-gray-600">{metrics.summary.completed_campaigns}</div>
                            <div className="text-sm text-gray-600 mt-1">Completadas</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Right Column - Recent Campaigns (1 column, smaller) */}
              <div className="lg:col-span-1 space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Campañas Recientes</h3>
                {campaigns.length === 0 ? (
                  <Card>
                    <CardContent className="p-4 text-center text-gray-500">
                      <p className="mb-3 text-sm">No tienes campañas aún</p>
                      <Button 
                        onClick={() => navigate("/campaigns")} 
                        className="bg-blue-600 hover:bg-blue-700 text-xs"
                        size="sm"
                      >
                        Crear Campaña
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {campaigns.map((campaign) => (
                      <Card
                        key={campaign.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold line-clamp-1">{campaign.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${statusColors[campaign.status] || statusColors.active}`}>
                              {campaign.status === "active" ? "Activa" : campaign.status === "paused" ? "Pausada" : "Completada"}
                            </span>
                            <div className="flex gap-1">
                              {campaign.platforms.slice(0, 2).map((platform) => (
                                <span key={platform} className="text-xs text-gray-500">
                                  {platformLabels[platform] || platform}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">
                            <div>${campaign.spend_usd.toFixed(0)} / ${campaign.budget_usd.toFixed(0)}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button
                      onClick={() => navigate("/campaigns")}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      size="sm"
                    >
                      Ver Todas
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
