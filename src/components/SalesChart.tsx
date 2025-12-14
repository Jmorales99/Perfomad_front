import { useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { SalesHistoryPoint } from "@/infrastructure/api/campaignsRepository"

interface SalesChartProps {
  data: SalesHistoryPoint[]
  improvement: number | null
  periodDays: number
  title?: string
}

export function SalesChart({ data, improvement, periodDays, title = "Historial de Ventas" }: SalesChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null

    // Sort by date
    const sorted = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return sorted
  }, [data])

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No hay datos de ventas disponibles</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate max value for scaling
  const maxSales = Math.max(...chartData.map((d) => d.total_sales), 1)
  const minSales = Math.min(...chartData.map((d) => d.total_sales), 0)
  const range = maxSales - minSales || 1

  // Chart dimensions
  const width = 100
  const height = 60
  const padding = 10

  // Generate path for line chart
  const points = chartData.map((point, index) => {
    const x = padding + (index / (chartData.length - 1 || 1)) * (width - padding * 2)
    const y = height - padding - ((point.total_sales - minSales) / range) * (height - padding * 2)
    return { x, y, ...point }
  })

  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ")

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {improvement !== null && (
            <div className={`flex items-center gap-1 ${improvement >= 0 ? "text-green-600" : "text-red-600"}`}>
              {improvement >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-semibold">
                {improvement >= 0 ? "+" : ""}
                {improvement.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Últimos {periodDays} días • {chartData.length} puntos de datos
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* SVG Chart */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-48 border-b border-l border-gray-200"
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padding + ratio * (height - padding * 2)
                return (
                  <line
                    key={ratio}
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="0.5"
                  />
                )
              })}

              {/* Sales line */}
              <path
                d={pathData}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
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
                    {formatDate(point.date)}: ${point.total_sales.toFixed(2)}
                  </title>
                </circle>
              ))}
            </svg>
          </div>

          {/* Legend and Summary */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-gray-500 mb-1">Ventas Totales</p>
              <p className="text-lg font-bold text-blue-600">
                ${chartData.reduce((sum, d) => sum + d.total_sales, 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Promedio Diario</p>
              <p className="text-lg font-bold text-gray-700">
                ${(chartData.reduce((sum, d) => sum + d.total_sales, 0) / chartData.length).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Último Día</p>
              <p className="text-lg font-bold text-green-600">
                ${chartData[chartData.length - 1].total_sales.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Timeline labels */}
          {chartData.length > 0 && (
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{formatDate(chartData[0].date)}</span>
              <span>{formatDate(chartData[chartData.length - 1].date)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

