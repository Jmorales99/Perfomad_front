import {
  DollarSign,
  Eye,
  MousePointerClick,
  Percent,
  TrendingUp,
  Users,
} from "lucide-react"
import KpiCard from "./KpiCard"
import { fmt, fmtCurrency, fmtMultiplier, fmtPct } from "./formatters"
import { MetricTooltip } from "@/interface/components/MetricTooltip"

export interface NormalizedMetrics {
  spend?: number | null
  impressions?: number | null
  clicks?: number | null
  reach?: number | null
  ctr?: number | null
  cpc?: number | null
  cpm?: number | null
  conversions?: number | null
  revenue?: number | null
  roas?: number | null
  cpa?: number | null
}

interface PlatformKpisProps {
  metrics: NormalizedMetrics
  currency?: string
}

export default function PlatformKpis({ metrics, currency = "USD" }: PlatformKpisProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Rendimiento del período
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <KpiCard
            label={<MetricTooltip metric="spend">Gasto</MetricTooltip>}
            value={fmtCurrency(metrics.spend, currency)}
            icon={<DollarSign className="w-4 h-4" />}
            accent="green"
          />
          <KpiCard
            label={<MetricTooltip metric="impressions">Impresiones</MetricTooltip>}
            value={fmt(metrics.impressions)}
            icon={<Eye className="w-4 h-4" />}
            accent="blue"
          />
          <KpiCard
            label={<MetricTooltip metric="clicks">Clics</MetricTooltip>}
            value={fmt(metrics.clicks)}
            sub={metrics.ctr != null ? `CTR ${fmtPct(metrics.ctr)}` : undefined}
            icon={<MousePointerClick className="w-4 h-4" />}
            accent="purple"
          />
          <KpiCard
            label={<MetricTooltip metric="reach">Alcance</MetricTooltip>}
            value={fmt(metrics.reach)}
            icon={<Users className="w-4 h-4" />}
            accent="orange"
          />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Eficiencia
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <KpiCard
            label={<MetricTooltip metric="cpc">CPC</MetricTooltip>}
            value={fmtCurrency(metrics.cpc, currency)}
            sub="Costo por clic"
            icon={<MousePointerClick className="w-4 h-4" />}
            accent="blue"
          />
          <KpiCard
            label={<MetricTooltip metric="cpm">CPM</MetricTooltip>}
            value={fmtCurrency(metrics.cpm, currency)}
            sub="Costo por mil imp."
            icon={<DollarSign className="w-4 h-4" />}
            accent="purple"
          />
          <KpiCard
            label={<MetricTooltip metric="ctr">CTR</MetricTooltip>}
            value={fmtPct(metrics.ctr)}
            sub="Tasa de clics"
            icon={<Percent className="w-4 h-4" />}
            accent="orange"
          />
          <KpiCard
            label={<MetricTooltip metric="roas">ROAS</MetricTooltip>}
            value={fmtMultiplier(metrics.roas)}
            sub={
              metrics.revenue != null
                ? `Ingresos: ${fmtCurrency(metrics.revenue, currency)}`
                : undefined
            }
            icon={<TrendingUp className="w-4 h-4" />}
            accent="green"
          />
        </div>
      </div>

      {(metrics.conversions != null || metrics.revenue != null || metrics.cpa != null) && (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Conversiones
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {metrics.conversions != null && (
              <KpiCard
                label={<MetricTooltip metric="conversions">Conversiones</MetricTooltip>}
                value={fmt(metrics.conversions)}
                icon={<TrendingUp className="w-4 h-4" />}
                accent="green"
              />
            )}
            {metrics.revenue != null && (
              <KpiCard
                label={<MetricTooltip metric="revenue">Ingresos</MetricTooltip>}
                value={fmtCurrency(metrics.revenue, currency)}
                icon={<DollarSign className="w-4 h-4" />}
                accent="blue"
              />
            )}
            {metrics.cpa != null && (
              <KpiCard
                label={<MetricTooltip metric="cpa">CPA</MetricTooltip>}
                value={fmtCurrency(metrics.cpa, currency)}
                sub="Costo por conversión"
                icon={<DollarSign className="w-4 h-4" />}
                accent="orange"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
