import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignOverview,
  checkCanCreateCampaign,
  type CampaignDTO,
  type Platform,
  type CreateCampaignPayload,
  type AdAccountError,
} from "@/infrastructure/api/campaignsRepository"
import { getImages, getUploadUrl } from "@/infrastructure/api/imagesRepository"
import { getConnectedAccounts, type ConnectedAccount } from "@/infrastructure/api/subscriptionRepository"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { Pencil, Trash2, Rocket, Upload, X, BarChart3, RefreshCcw, Eye, MousePointerClick, TrendingUp, Users, DollarSign, AlertCircle, CheckCircle2, Filter, Calendar, Search } from "lucide-react"
import axios from "axios"
import { useAuth } from "@/app/providers/AuthProvider"
import { SubscriptionBanner } from "@/components/SubscriptionBanner"
import { AdAccountErrorModal } from "@/interface/components/AdAccountErrorModal"

interface ImageItem {
  name: string
  url: string
  path: string
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CampaignDTO | null>(null)
  const [allImages, setAllImages] = useState<ImageItem[]>([])
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [adAccountError, setAdAccountError] = useState<AdAccountError | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState<string>("")
  type DateFilterType = "all" | "last_7_days" | "this_week" | "this_month" | "custom"
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all")
  const [customStartDate, setCustomStartDate] = useState<string>("")
  const [customEndDate, setCustomEndDate] = useState<string>("")
  const [allCampaigns, setAllCampaigns] = useState<CampaignDTO[]>([]) // Store all campaigns
  const [selectedCampaignNames, setSelectedCampaignNames] = useState<string[]>([]) // Selected campaign names
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]) // Selected platforms
  const [showCampaignFilter, setShowCampaignFilter] = useState(false) // Show campaign name filter dropdown
  const [showPlatformFilter, setShowPlatformFilter] = useState(false) // Show platform filter dropdown
  
  const [form, setForm] = useState<{
    name: string
    platforms: Platform[]
    description: string
    budget_usd: number
    product_price?: number
    product_cost?: number
    images: ImageItem[]
  }>({
    name: "",
    platforms: ["meta"],
    description: "",
    budget_usd: 0,
    product_price: undefined,
    product_cost: undefined,
    images: [],
  })

  const navigate = useNavigate()
  const { hasSubscription } = useAuth()

  // ===========================
  // Fetch campañas e imágenes
  // ===========================
  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const data = await getCampaigns()
      setAllCampaigns(data) // Store all campaigns - the useEffect will handle filtering
    } catch (e) {
      console.error("Error al cargar campañas:", e)
    } finally {
      setLoading(false)
    }
  }
  
  // Handle filter change
  const handleFilterChange = (filter: DateFilterType) => {
    setDateFilter(filter)
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
    
    setDateFilter("custom")
    // The useEffect will handle the filtering
  }
  
  // Handle start date change - auto-set end date if not set
  const handleStartDateChange = (date: string) => {
    setCustomStartDate(date)
    // If end date is not set or is before the new start date, set it to today
    if (!customEndDate || new Date(date) > new Date(customEndDate)) {
      setCustomEndDate(new Date().toISOString().split('T')[0])
    }
  }
  
  // Get formatted date range text for display
  const getDateRangeText = (): string | null => {
    if (dateFilter === "all") return null
    
    if (dateFilter === "custom" && customStartDate && customEndDate) {
      const start = new Date(customStartDate).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
      const end = new Date(customEndDate).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
      return `${start} - ${end}`
    }
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (dateFilter) {
      case "last_7_days":
        const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
        const start7 = sevenDaysAgo.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
        const end7 = today.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
        return `${start7} - ${end7}`
      case "this_week":
        const dayOfWeek = today.getDay()
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        const monday = new Date(today.getTime() - daysToMonday * 24 * 60 * 60 * 1000)
        const startWeek = monday.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
        const endWeek = today.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
        return `${startWeek} - ${endWeek}`
      case "this_month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const startMonth = monthStart.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
        const endMonth = today.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
        return `${startMonth} - ${endMonth}`
      default:
        return null
    }
  }

  const fetchImages = async () => {
    try {
      const imgs = await getImages()
      setAllImages(imgs)
    } catch (e) {
      console.error("Error al cargar imágenes:", e)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    if (showModal) {
      fetchImages()
      fetchConnectedAccounts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal])

  // Memoize filtered campaigns to avoid recalculation on every render
  const filteredCampaigns = useMemo(() => {
    if (allCampaigns.length === 0) {
      return []
    }
    
    let filtered = [...allCampaigns]
    
    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      today.setHours(0, 0, 0, 0)
      let filterStart: Date
      let filterEnd: Date = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      
      switch (dateFilter) {
        case "last_7_days":
          filterStart = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
          filterStart.setHours(0, 0, 0, 0)
          break
        case "this_week":
          const dayOfWeek = today.getDay()
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
          filterStart = new Date(today.getTime() - daysToMonday * 24 * 60 * 60 * 1000)
          filterStart.setHours(0, 0, 0, 0)
          break
        case "this_month":
          filterStart = new Date(today.getFullYear(), today.getMonth(), 1)
          filterStart.setHours(0, 0, 0, 0)
          break
        case "custom":
          if (customStartDate && customEndDate) {
            filterStart = new Date(customStartDate)
            filterEnd = new Date(customEndDate)
            filterEnd.setHours(23, 59, 59, 999)
          } else {
            break
          }
          break
        default:
          break
      }
      
      if (dateFilter === "custom" && customStartDate && customEndDate) {
        filtered = filtered.filter((campaign) => {
          const campaignDate = campaign.created_at 
            ? new Date(campaign.created_at)
            : new Date(campaign.start_date)
          return campaignDate >= filterStart && campaignDate <= filterEnd
        })
      } else if (dateFilter !== "custom") {
        filtered = filtered.filter((campaign) => {
          const campaignDate = campaign.created_at 
            ? new Date(campaign.created_at)
            : new Date(campaign.start_date)
          return campaignDate >= filterStart && campaignDate <= filterEnd
        })
      }
    }
    
    // Apply text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((campaign) => {
        const nameMatch = campaign.name.toLowerCase().includes(query)
        const descriptionMatch = campaign.description?.toLowerCase().includes(query)
        const platformMatch = (Array.isArray(campaign.platforms) 
          ? campaign.platforms 
          : [campaign.platforms ?? "meta"]
        ).some((p) => p.toLowerCase().includes(query))
        return nameMatch || descriptionMatch || platformMatch
      })
    }
    
    // Apply campaign name filter (checkboxes)
    if (selectedCampaignNames.length > 0) {
      filtered = filtered.filter((campaign) => 
        selectedCampaignNames.includes(campaign.name)
      )
    }
    
    // Apply platform filter (checkboxes)
    if (selectedPlatforms.length > 0) {
      filtered = filtered.filter((campaign) => {
        const campaignPlatforms = Array.isArray(campaign.platforms) 
          ? campaign.platforms 
          : [campaign.platforms ?? "meta"]
        return campaignPlatforms.some((p) => selectedPlatforms.includes(p as Platform))
      })
    }
    
    return filtered
  }, [allCampaigns, dateFilter, customStartDate, customEndDate, searchQuery, selectedCampaignNames, selectedPlatforms])
  
  // Update campaigns state when filtered campaigns change
  useEffect(() => {
    setCampaigns(filteredCampaigns)
  }, [filteredCampaigns])
  
  // Get unique campaign names for filter (memoized)
  const getUniqueCampaignNames = useMemo(() => {
    const names = allCampaigns.map((c) => c.name)
    return Array.from(new Set(names)).sort()
  }, [allCampaigns])

  // Fetch connected accounts to filter available platforms (memoized)
  const fetchConnectedAccounts = useCallback(async () => {
    if (!hasSubscription) return
    
    setLoadingAccounts(true)
    try {
      const data = await getConnectedAccounts()
      const activeAccounts = data.accounts.filter((acc) => acc.is_active)
      setConnectedAccounts(activeAccounts)
      
      // If creating (not editing), auto-select first available platform
      if (!editing && activeAccounts.length > 0) {
        const availablePlatforms = activeAccounts.map((acc) => acc.platform) as Platform[]
        if (availablePlatforms.length > 0 && form.platforms.length === 0) {
          setForm((prev) => ({ ...prev, platforms: [availablePlatforms[0]] }))
        }
      }
      
    } catch (e) {
      console.error("Error al cargar cuentas conectadas:", e)
    } finally {
      setLoadingAccounts(false)
    }
  }, [hasSubscription, editing, form.platforms])

  // ===========================
  // Subida de imagen
  // ===========================
  const handleUploadImage = async (file: File) => {
    if (!hasSubscription) {
      alert("Necesitas una suscripción activa para subir imágenes.")
      return
    }

    try {
      const { uploadUrl } = await getUploadUrl(file.name)
      await axios.put(uploadUrl, file, { headers: { "Content-Type": file.type } })
      await fetchImages()
    } catch (err) {
      console.error("Error subiendo imagen:", err)
    }
  }

  // ===========================
  // Guardar campaña
  // ===========================
  const handleSave = async () => {
    if (!hasSubscription) {
      alert("Necesitas una suscripción activa para crear o editar campañas.")
      return
    }

    if (form.platforms.length === 0) {
      alert("Debes seleccionar al menos una plataforma.")
      return
    }

    // Validate that all selected platforms have connected accounts
    const availablePlatforms = connectedAccounts
      .filter((acc) => acc.is_active)
      .map((acc) => acc.platform)
    
    const invalidPlatforms = form.platforms.filter(
      (p) => !availablePlatforms.includes(p)
    )

    if (invalidPlatforms.length > 0) {
      const platformNames = invalidPlatforms.map(
        (p) => p === "meta" ? "Meta" : p === "google_ads" ? "Google Ads" : "LinkedIn"
      ).join(", ")
      alert(
        `Las siguientes plataformas no tienen cuentas conectadas: ${platformNames}.\n` +
        `Por favor, conecta estas cuentas en Configuración > Integraciones antes de crear la campaña.`
      )
      return
    }

    try {
      const payload: CreateCampaignPayload = {
        name: form.name,
        platforms: form.platforms,
        description: form.description || undefined,
        budget_usd: form.budget_usd || undefined,
        product_price: form.product_price,
        product_cost: form.product_cost,
        images: form.images
          .filter((i) => i.path)
          .map((i) => ({ path: i.path! })),
      }

      if (editing) {
        await updateCampaign(editing.id, payload)
      } else {
        await createCampaign(payload)
      }

      setShowModal(false)
      // Reset form after successful save
      setEditing(null)
      setForm({
        name: "",
        platforms: [],
        description: "",
        budget_usd: 0,
        product_price: undefined,
        product_cost: undefined,
        images: [],
      })
      await fetchCampaigns()
    } catch (e: any) {
      console.error("Error al guardar campaña:", e)
      
      // Check if it's an ad account error
      if (e.error === "NO_AD_ACCOUNTS" || e.error === "MISSING_PLATFORM_ACCOUNTS" || e.show_popup) {
        setAdAccountError(e as AdAccountError)
        setShowErrorModal(true)
        // Don't close the form modal - let user see the error and choose to connect accounts
      } else {
        // Other errors - show alert
        alert(e.message || "Error al guardar campaña. Intenta nuevamente.")
      }
    }
  }

  // ===========================
  // Pre-check before showing modal
  // ===========================
  const handleOpenCreateModal = async () => {
    if (!hasSubscription) {
      alert("Necesitas una suscripción activa para crear campañas.")
      return
    }

    // Check if user can create campaigns
    try {
      const canCreate = await checkCanCreateCampaign()
      if (!canCreate.can_create) {
        // Show error modal with details
        setAdAccountError({
          error: canCreate.ad_accounts_count === 0 ? "NO_AD_ACCOUNTS" : "MISSING_PLATFORM_ACCOUNTS",
          message: canCreate.message,
          title: "No puedes crear campañas",
          details: canCreate.missing_requirements.join(", "),
          action_required: "Conecta tus cuentas de publicidad",
          help_url: "/settings",
          action_button_text: "Conectar cuentas ahora",
          show_popup: true,
        })
        setShowErrorModal(true)
        return
      }

      // All good - show form modal
      setShowModal(true)
    } catch (e) {
      console.error("Error verificando si puede crear campaña:", e)
      // On error, still show the modal - let the save handle the error
      setShowModal(true)
    }
  }

  // ===========================
  // Eliminar campaña
  // ===========================
  const handleDelete = async (id: string) => {
    if (!hasSubscription) {
      alert("Necesitas una suscripción activa para eliminar campañas.")
      return
    }

    if (confirm("¿Seguro que deseas eliminar esta campaña?")) {
      await deleteCampaign(id)
      fetchCampaigns()
    }
  }

  // ===========================
  // Obtener métricas (read-only, no requiere suscripción)
  // ===========================
  const handleViewMetrics = async (id: string) => {
    setRefreshing(id)
    try {
      const overview = await getCampaignOverview(id)
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, mock_stats: overview.metrics || overview.mock_stats || {} }
            : c
        )
      )
    } catch (e) {
      console.error("Error obteniendo métricas:", e)
      alert("No se pudieron obtener las métricas de la campaña.")
    } finally {
      setRefreshing(null)
    }
  }

  // ===========================
  // Calculate Dashboard Metrics (memoized)
  // ===========================
  const dashboardMetrics = useMemo(() => ({
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.status === "active").length,
    totalSpend: campaigns.reduce((sum, c) => sum + (c.spend_usd || 0), 0),
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget_usd || 0), 0),
    totalImpressions: campaigns.reduce((sum, c) => {
      if (c.mock_stats) {
        if (typeof c.mock_stats === "object" && !Array.isArray(c.mock_stats)) {
          return sum + (c.mock_stats.impressions || 0)
        }
      }
      return sum
    }, 0),
    totalClicks: campaigns.reduce((sum, c) => {
      if (c.mock_stats) {
        if (typeof c.mock_stats === "object" && !Array.isArray(c.mock_stats)) {
          return sum + (c.mock_stats.clicks || 0)
        }
      }
      return sum
    }, 0),
    totalReach: campaigns.reduce((sum, c) => {
      if (c.mock_stats) {
        if (typeof c.mock_stats === "object" && !Array.isArray(c.mock_stats)) {
          return sum + (c.mock_stats.reach || 0)
        }
      }
      return sum
    }, 0),
    totalConversions: campaigns.reduce((sum, c) => {
      if (c.mock_stats) {
        if (typeof c.mock_stats === "object" && !Array.isArray(c.mock_stats)) {
          return sum + (c.mock_stats.conversions || 0)
        }
      }
      return sum
    }, 0),
  }), [campaigns])

  const averageCTR = useMemo(() => dashboardMetrics.totalImpressions > 0
    ? (dashboardMetrics.totalClicks / dashboardMetrics.totalImpressions) * 100
    : 0, [dashboardMetrics.totalImpressions, dashboardMetrics.totalClicks])

  // ===========================
  // UI Data
  // ===========================
  const platformLabels: Record<Platform, string> = {
    meta: "Meta",
    google_ads: "Google Ads",
    linkedin: "LinkedIn",
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    completed: "bg-gray-100 text-gray-700",
  }

  // ===========================
  // Render
  // ===========================
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 🧩 Banner de suscripción */}
      <SubscriptionBanner />

      {/* Header */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate("/home")}>
          ← Volver
        </Button>
        <Button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={!hasSubscription}
        >
          Nueva campaña
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-700">Tus campañas</h1>
        </div>
        
        {/* Search and Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Box */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, descripción o plataforma..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Filters Section */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Campaign Names Filter */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Campañas
                    {selectedCampaignNames.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {selectedCampaignNames.length}
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
                  {getUniqueCampaignNames.map((name) => (
                    <DropdownMenuCheckboxItem
                      key={name}
                      checked={selectedCampaignNames.includes(name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCampaignNames([...selectedCampaignNames, name])
                        } else {
                          setSelectedCampaignNames(selectedCampaignNames.filter((n) => n !== name))
                        }
                      }}
                      onSelect={(e) => {
                        e.preventDefault()
                      }}
                    >
                      {name}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {selectedCampaignNames.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          setSelectedCampaignNames([])
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
                    {dateFilter !== "all" && (
                      <Badge variant="secondary" className="ml-1">
                        {dateFilter === "custom" && customStartDate ? "✓" : "✓"}
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
                      {(customStartDate || customEndDate) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setCustomStartDate("")
                            setCustomEndDate("")
                            handleFilterChange("all")
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {dateFilter !== "all" && getDateRangeText() && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5">
                        <div className="text-xs text-gray-500 mb-1">Rango actual:</div>
                        <div className="text-sm font-medium text-blue-700">
                          {getDateRangeText()}
                        </div>
                      </div>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          handleFilterChange("all")
                          setCustomStartDate("")
                          setCustomEndDate("")
                        }}
                        onSelect={(e) => {
                          e.preventDefault()
                        }}
                        className="text-red-600"
                      >
                        Limpiar filtro de fecha
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Clear All Filters */}
              {(searchQuery || dateFilter !== "all" || selectedCampaignNames.length > 0 || selectedPlatforms.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setDateFilter("all")
                    setCustomStartDate("")
                    setCustomEndDate("")
                    setSelectedCampaignNames([])
                    setSelectedPlatforms([])
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10">Cargando campañas...</p>
      ) : (
        <>
          {/* Dashboard Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Campañas</p>
                    <p className="text-2xl font-bold text-blue-600">{dashboardMetrics.totalCampaigns}</p>
                    <p className="text-xs text-gray-500 mt-1">{dashboardMetrics.activeCampaigns} activas</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Gasto Total</p>
                    <p className="text-2xl font-bold text-green-600">${dashboardMetrics.totalSpend.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">de ${dashboardMetrics.totalBudget.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Impresiones</p>
                    <p className="text-2xl font-bold text-purple-600">{dashboardMetrics.totalImpressions.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Personas que vieron</p>
                  </div>
                  <Eye className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Clics</p>
                    <p className="text-2xl font-bold text-orange-600">{dashboardMetrics.totalClicks.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">CTR: {averageCTR.toFixed(2)}%</p>
                  </div>
                  <MousePointerClick className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Alcance</p>
                    <p className="text-2xl font-bold text-indigo-600">{dashboardMetrics.totalReach.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Personas únicas</p>
                  </div>
                  <Users className="w-8 h-8 text-indigo-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Conversiones</p>
                    <p className="text-2xl font-bold text-pink-600">{dashboardMetrics.totalConversions.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Acciones completadas</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-pink-400" />
                </div>
              </CardContent>
            </Card>
            </div>
          
          {/* Results Count */}
          {(searchQuery || dateFilter !== "all" || selectedCampaignNames.length > 0 || selectedPlatforms.length > 0) && campaigns.length > 0 && (
            <div className="text-sm text-gray-600">
              Mostrando <strong>{campaigns.length}</strong> de <strong>{allCampaigns.length}</strong> campañas
            </div>
          )}

          {/* Campaigns List */}
          {campaigns.length === 0 ? (
            <Card className="border-blue-100 text-center p-8">
              <p className="text-gray-600 mb-4">
                {allCampaigns.length === 0
                  ? "Aún no tienes campañas creadas."
                  : searchQuery || dateFilter !== "all" || selectedCampaignNames.length > 0 || selectedPlatforms.length > 0
                  ? "No se encontraron campañas que coincidan con los filtros seleccionados."
                  : "Aún no tienes campañas creadas."}
              </p>
              {(searchQuery || dateFilter !== "all" || selectedCampaignNames.length > 0 || selectedPlatforms.length > 0) && allCampaigns.length > 0 && (
                <Button
                  variant="outline"
                  className="mb-4"
                  onClick={() => {
                    setSearchQuery("")
                    setDateFilter("all")
                    setCustomStartDate("")
                    setCustomEndDate("")
                    setSelectedCampaignNames([])
                    setSelectedPlatforms([])
                  }}
                >
                  Limpiar filtros y ver todas las campañas
                </Button>
              )}
              {allCampaigns.length === 0 && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleOpenCreateModal}
                  disabled={!hasSubscription}
                >
                  Crear campaña
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {campaigns.map((c) => (
                <Card
                  key={c.id}
                  className="border border-blue-100 shadow-sm hover:shadow-md transition"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800 mb-2">
                          {c.number ? `Campaña #${c.number} — ${c.name}` : c.name}
                        </h3>
                        <div className="flex gap-2 flex-wrap">
                          <Badge
                            className={statusColors[c.status] || "bg-gray-100 text-gray-700"}
                          >
                            {c.status === "active"
                              ? "Activa"
                              : c.status === "paused"
                              ? "Pausada"
                              : "Completada"}
                          </Badge>
                          {(Array.isArray(c.platforms)
                            ? c.platforms
                            : [c.platforms ?? "meta"]
                          ).map((p) => (
                            <Badge key={p} variant="outline" className="text-xs">
                              {platformLabels[p as Platform]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {c.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {c.description}
                      </p>
                    )}

                    {/* Budget Info */}
                    <div className="flex justify-between text-sm text-gray-700 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="block text-gray-500 text-xs mb-1">Presupuesto</span>
                        <strong className="text-lg">${c.budget_usd.toLocaleString()}</strong>
                      </div>
                      <div className="text-right">
                        <span className="block text-gray-500 text-xs mb-1">Gastado</span>
                        <strong className="text-lg">${c.spend_usd?.toLocaleString() ?? 0}</strong>
                      </div>
                    </div>

                    {/* Metrics Dashboard */}
                    {c.mock_stats ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Eye className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-gray-600">Impresiones</span>
                          </div>
                          <p className="text-lg font-bold text-blue-600">
                            {c.mock_stats.impressions?.toLocaleString() || 0}
                          </p>
                          <p className="text-xs text-gray-500">Personas que vieron</p>
                        </div>

                        <div className="p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <MousePointerClick className="w-4 h-4 text-purple-600" />
                            <span className="text-xs text-gray-600">Clics</span>
                          </div>
                          <p className="text-lg font-bold text-purple-600">
                            {c.mock_stats.clicks?.toLocaleString() || 0}
                          </p>
                          <p className="text-xs text-gray-500">CTR: {((c.mock_stats.ctr || 0) * 100).toFixed(2)}%</p>
                        </div>

                        {c.mock_stats.reach && (
                          <div className="p-3 bg-indigo-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="w-4 h-4 text-indigo-600" />
                              <span className="text-xs text-gray-600">Alcance</span>
                            </div>
                            <p className="text-lg font-bold text-indigo-600">
                              {c.mock_stats.reach.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">Personas únicas</p>
                          </div>
                        )}

                        {c.mock_stats.conversions !== undefined && (
                          <div className="p-3 bg-pink-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-4 h-4 text-pink-600" />
                              <span className="text-xs text-gray-600">Conversiones</span>
                            </div>
                            <p className="text-lg font-bold text-pink-600">
                              {c.mock_stats.conversions.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {c.mock_stats.cost_per_conversion
                                ? `$${c.mock_stats.cost_per_conversion.toFixed(2)}/conv`
                                : "Acciones"}
                            </p>
                          </div>
                        )}

                        {c.mock_stats.cpa !== undefined && (
                          <div className="p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="w-4 h-4 text-red-600" />
                              <span className="text-xs text-gray-600">CPA</span>
                            </div>
                            <p className="text-lg font-bold text-red-600">
                              ${c.mock_stats.cpa.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">Cost Per Acquisition</p>
                          </div>
                        )}

                        {c.mock_stats.roa !== undefined && (
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-gray-600">ROA</span>
                            </div>
                            <p className="text-lg font-bold text-green-600">
                              {c.mock_stats.roa.toFixed(2)}x
                            </p>
                            <p className="text-xs text-gray-500">Return on Ad Spend</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm text-gray-500 italic">Sincronizando métricas...</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => handleViewMetrics(c.id)}
                          disabled={refreshing === c.id}
                        >
                          {refreshing === c.id ? (
                            <RefreshCcw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <RefreshCcw className="w-4 h-4 mr-2" />
                              Obtener métricas
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 flex items-center gap-2"
                        onClick={() => navigate(`/optimize/${c.id}`)}
                        disabled={!hasSubscription}
                      >
                        <Rocket className="w-4 h-4" /> Optimizar
                      </Button>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="border-gray-300 hover:bg-gray-50 p-2"
                          onClick={() => handleViewMetrics(c.id)}
                          disabled={refreshing === c.id}
                          title="Actualizar métricas"
                        >
                          {refreshing === c.id ? (
                            <RefreshCcw className="w-4 h-4 animate-spin text-blue-600" />
                          ) : (
                            <BarChart3 className="w-4 h-4 text-blue-600" />
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          className="border-gray-300 hover:bg-gray-50 p-2"
                          onClick={async () => {
                            if (!hasSubscription) {
                              alert("Debes tener una suscripción activa para editar campañas.")
                              return
                            }
                            // Load connected accounts first
                            try {
                              const accountsData = await getConnectedAccounts()
                              const activeAccounts = accountsData.accounts.filter((acc) => acc.is_active)
                              setConnectedAccounts(activeAccounts)
                              
                              const campaignPlatforms = Array.isArray(c.platforms)
                                ? c.platforms
                                : [c.platforms ?? "meta"]
                              
                              // Filter platforms to only include connected ones
                              const availablePlatforms = activeAccounts.map((acc) => acc.platform)
                              const validPlatforms = campaignPlatforms.filter((p) => availablePlatforms.includes(p))
                              
                              if (validPlatforms.length === 0) {
                                const platformNames = campaignPlatforms.map(
                                  (p) => p === "meta" ? "Meta" : p === "google_ads" ? "Google Ads" : "LinkedIn"
                                ).join(", ")
                                alert(
                                  `Esta campaña usa las plataformas: ${platformNames}, pero ninguna de ellas tiene cuentas conectadas actualmente. ` +
                                  `Por favor, conecta las cuentas necesarias antes de editar.`
                                )
                                return
                              }
                              
                              if (validPlatforms.length < campaignPlatforms.length) {
                                const removedPlatforms = campaignPlatforms.filter((p) => !availablePlatforms.includes(p))
                                const removedNames = removedPlatforms.map(
                                  (p) => p === "meta" ? "Meta" : p === "google_ads" ? "Google Ads" : "LinkedIn"
                                ).join(", ")
                                alert(
                                  `Algunas plataformas de esta campaña (${removedNames}) ya no tienen cuentas conectadas y fueron removidas.`
                                )
                              }
                              
                              setEditing(c)
                              setForm({
                                name: c.name,
                                platforms: validPlatforms,
                                description: c.description ?? "",
                                budget_usd: c.budget_usd,
                                product_price: c.product_price,
                                product_cost: c.product_cost,
                                images: (c.images || []).map((img) => ({
                                  name: (img.path ?? "").split("/").pop() || "imagen",
                                  url: img.signed_url ?? "",
                                  path: img.path ?? "",
                                })),
                              })
                              setShowModal(true)
                            } catch (err) {
                              console.error("Error loading accounts:", err)
                              // Still allow editing, validation will happen on save
                              setEditing(c)
                              setForm({
                                name: c.name,
                                platforms: Array.isArray(c.platforms)
                                  ? c.platforms
                                  : [c.platforms ?? "meta"],
                                description: c.description ?? "",
                                budget_usd: c.budget_usd,
                                product_price: c.product_price,
                                product_cost: c.product_cost,
                                images: (c.images || []).map((img) => ({
                                  name: (img.path ?? "").split("/").pop() || "imagen",
                                  url: img.signed_url ?? "",
                                  path: img.path ?? "",
                                })),
                              })
                              setShowModal(true)
                            }
                          }}
                          disabled={!hasSubscription}
                          title="Editar campaña"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="destructive"
                          className="p-2"
                          onClick={() => handleDelete(c.id)}
                          disabled={!hasSubscription}
                          title="Eliminar campaña"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal creación/edición */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-blue-700">
              {editing ? "Editar campaña" : "Nueva campaña"}
            </DialogTitle>
          </DialogHeader>

          {/* FORM */}
          <form
            className="space-y-6 p-1"
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
          >
            {/* Nombre */}
            <div>
              <Label>Nombre</Label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                required
                disabled={!hasSubscription}
              />
            </div>

            {/* Plataformas */}
            <div>
              <Label>Plataformas</Label>
              {loadingAccounts ? (
                <div className="text-sm text-gray-500 mt-2">Cargando cuentas conectadas...</div>
              ) : connectedAccounts.length === 0 ? (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800">
                        No tienes cuentas de publicidad conectadas
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Debes conectar al menos una cuenta (Meta, Google Ads o LinkedIn) para crear campañas.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                        onClick={() => {
                          setShowModal(false)
                          navigate("/settings")
                        }}
                      >
                        Conectar cuentas ahora
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 mt-1">
                    {(["meta", "google_ads", "linkedin"] as Platform[]).map((p) => {
                      const isConnected = connectedAccounts.some((acc) => acc.platform === p && acc.is_active)
                      const platformName = p === "meta" ? "Meta" : p === "google_ads" ? "Google Ads" : "LinkedIn"
                      const connectedAccount = connectedAccounts.find((acc) => acc.platform === p && acc.is_active)
                      
                      return (
                        <div
                          key={p}
                          className={`flex items-center justify-between border p-3 rounded-lg ${
                            isConnected
                              ? "border-gray-200 bg-white"
                              : "border-gray-200 bg-gray-50 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {isConnected ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <Label className={`${!isConnected ? "text-gray-500" : ""}`}>
                                {platformName}
                              </Label>
                              {isConnected && connectedAccount && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {connectedAccount.account_name || connectedAccount.platform_account_id}
                                </p>
                              )}
                              {!isConnected && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Cuenta no conectada
                                </p>
                              )}
                            </div>
                          </div>
                          <Switch
                            checked={form.platforms.includes(p)}
                            onCheckedChange={(v) => {
                              if (!isConnected) {
                                // Show message to connect account
                                alert(`Debes conectar tu cuenta de ${platformName} primero. Ve a Configuración > Integraciones para conectar.`)
                                return
                              }
                              let updated = form.platforms
                              if (v) updated = [...form.platforms, p]
                              else updated = form.platforms.filter((x) => x !== p)
                              if (updated.length === 0) return
                              setForm({ ...form, platforms: updated })
                            }}
                            disabled={!hasSubscription || !isConnected}
                          />
                        </div>
                      )
                    })}
                  </div>
                  {connectedAccounts.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Solo puedes seleccionar plataformas con cuentas conectadas.{" "}
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={() => {
                          setShowModal(false)
                          navigate("/settings")
                        }}
                      >
                        Conectar más cuentas
                      </button>
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Descripción */}
            <div>
              <Label>Descripción</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-lg p-2 h-24 focus:ring-2 focus:ring-blue-500"
                disabled={!hasSubscription}
              />
            </div>

            {/* Presupuesto */}
            <div>
              <Label>Presupuesto (USD)</Label>
              <input
                type="number"
                value={form.budget_usd || ""}
                onChange={(e) => {
                  const inputValue = e.target.value
                  // Remove leading zeros when user starts typing
                  let cleanedValue = inputValue.replace(/^0+(?=\d)/, '')
                  // Convert to number, default to 0 if empty
                  const numValue = cleanedValue === "" ? 0 : Number(cleanedValue)
                  setForm({ ...form, budget_usd: numValue })
                }}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                disabled={!hasSubscription}
                min="0"
                step="0.01"
              />
            </div>

            {/* Product Pricing - For accurate ROA calculation */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Información del Producto (Para cálculo de ROA)
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Ingresa el precio y costo de tu producto para calcular métricas más precisas. 
                Esto ayuda a calcular el ROA (Retorno sobre inversión) basado en ganancia real.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Price */}
                <div>
                  <Label>Precio de Venta del Producto (USD) *</Label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.product_price ?? ""}
                    onChange={(e) => {
                      const inputValue = e.target.value
                      // Remove leading zeros when user starts typing
                      let cleanedValue = inputValue.replace(/^0+(?=\d)/, '')
                      setForm({ 
                        ...form, 
                        product_price: cleanedValue === "" ? undefined : Number(cleanedValue)
                      })
                    }}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 49.99"
                    disabled={!hasSubscription}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Precio al que vendes cada producto
                  </p>
                </div>

                {/* Product Cost */}
                <div>
                  <Label>Costo de Producción del Producto (USD)</Label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.product_cost ?? ""}
                    onChange={(e) => {
                      const inputValue = e.target.value
                      // Remove leading zeros when user starts typing
                      let cleanedValue = inputValue.replace(/^0+(?=\d)/, '')
                      setForm({ 
                        ...form, 
                        product_cost: cleanedValue === "" ? undefined : Number(cleanedValue)
                      })
                    }}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 20.00 (opcional)"
                    disabled={!hasSubscription}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Costo para producir cada producto (opcional, para ROA basado en profit)
                  </p>
                </div>
              </div>
            </div>

            {/* Galería */}
            <div>
              <Label>Imágenes</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {allImages.map((img) => {
                  const selected = form.images.some((i) => i.path === img.path)
                  return (
                    <div
                      key={img.url}
                      onClick={() => {
                        if (!hasSubscription) return
                        if (selected)
                          setForm({
                            ...form,
                            images: form.images.filter((i) => i.url !== img.url),
                          })
                        else setForm({ ...form, images: [...form.images, img] })
                      }}
                      onDoubleClick={() => setPreviewImage(img)}
                      className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all hover:scale-105 ${
                        selected
                          ? "border-blue-600 ring-2 ring-blue-400"
                          : "border-gray-200"
                      } ${!hasSubscription ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      {selected && (
                        <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-1 shadow-md">
                          ✓
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-3 flex gap-3">
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                  onClick={() => document.getElementById("uploadInput")?.click()}
                  disabled={!hasSubscription}
                >
                  <Upload className="w-4 h-4" /> Subir nueva imagen
                </Button>

                <input
                  id="uploadInput"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUploadImage(file)
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!hasSubscription}
              >
                Guardar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-8 -right-8 text-white"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="max-h-[80vh] max-w-full rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}

      {/* Ad Account Error Modal */}
      {adAccountError && (
        <AdAccountErrorModal
          error={adAccountError}
          open={showErrorModal}
          onClose={() => {
            setShowErrorModal(false)
            setAdAccountError(null)
          }}
        />
      )}
    </div>
  )
}
