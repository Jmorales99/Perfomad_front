import { type ReactNode, type CSSProperties, useState, useRef, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"

interface MetricDef {
  label: string
  description: string
}

const METRIC_DICT: Record<string, MetricDef> = {
  ctr: {
    label: "Tasa de Clics (CTR)",
    description: "Porcentaje de personas que hacen clic en tu anuncio después de verlo. Fórmula: (Clics ÷ Impresiones) × 100.",
  },
  cpc: {
    label: "Costo por Clic (CPC)",
    description: "Cuánto pagas en promedio por cada clic en tu anuncio.",
  },
  cpm: {
    label: "Costo por Mil Impresiones (CPM)",
    description: "Cuánto pagas por cada 1.000 veces que se muestra tu anuncio.",
  },
  roa: {
    label: "Retorno sobre Gasto Publicitario (ROA)",
    description: "Cuánto ganas por cada dólar invertido en publicidad. Ej: 3x = $3 de ingreso por $1 gastado. Fórmula: Ingresos ÷ Gasto.",
  },
  roas: {
    label: "Retorno sobre Gasto Publicitario (ROAS)",
    description: "Cuánto ganas por cada dólar invertido en publicidad. Ej: 3x = $3 de ingreso por $1 gastado. Fórmula: Ingresos ÷ Gasto.",
  },
  cpa: {
    label: "Costo por Adquisición (CPA)",
    description: "Cuánto pagas en promedio por cada conversión (compra, lead, registro, etc.).",
  },
  impressions: {
    label: "Impresiones",
    description: "Número de veces que tu anuncio fue mostrado en pantalla.",
  },
  clicks: {
    label: "Clics",
    description: "Número de veces que alguien hizo clic en tu anuncio.",
  },
  reach: {
    label: "Alcance",
    description: "Cantidad de personas únicas que vieron tu anuncio al menos una vez.",
  },
  conversions: {
    label: "Conversiones",
    description: "Acciones valiosas completadas por usuarios: compras, registros, llamadas, etc.",
  },
  spend: {
    label: "Gasto",
    description: "Total invertido en publicidad durante el período seleccionado.",
  },
  campaigns: {
    label: "Campañas",
    description: "Número total de campañas publicitarias en el período.",
  },
  revenue: {
    label: "Ingresos",
    description: "Dinero generado por conversiones atribuidas a tus anuncios.",
  },
  imp: {
    label: "Impresiones",
    description: "Número de veces que tu anuncio fue mostrado en pantalla.",
  },
}

const TOOLTIP_WIDTH = 224
const GAP = 8

interface MetricTooltipProps {
  /** Key into the metric dictionary (case-insensitive). */
  metric: string
  children: ReactNode
}

/**
 * Hover tooltip for metric labels. Rendered via portal with fixed positioning so it is not
 * clipped by parent overflow (e.g. overflow-x-auto on tables).
 */
export function MetricTooltip({ metric, children }: MetricTooltipProps) {
  const def = METRIC_DICT[metric.toLowerCase()]
  const triggerRef = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<"top" | "bottom">("top")
  const [style, setStyle] = useState<CSSProperties>({})

  const updatePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const halfW = TOOLTIP_WIDTH / 2
    const centerX = rect.left + rect.width / 2
    const left = Math.min(
      Math.max(centerX, halfW + 8),
      window.innerWidth - halfW - 8
    )

    const estH = 130
    const spaceAbove = rect.top
    const spaceBelow = window.innerHeight - rect.bottom
    const placeAbove = spaceAbove >= estH + GAP || spaceAbove > spaceBelow

    setPlacement(placeAbove ? "top" : "bottom")
    if (placeAbove) {
      setStyle({
        position: "fixed",
        left,
        top: rect.top - GAP,
        transform: "translate(-50%, -100%)",
        width: TOOLTIP_WIDTH,
        zIndex: 99999,
      })
    } else {
      setStyle({
        position: "fixed",
        left,
        top: rect.bottom + GAP,
        transform: "translateX(-50%)",
        width: TOOLTIP_WIDTH,
        zIndex: 99999,
      })
    }
  }, [])

  const onEnter = useCallback(() => {
    updatePosition()
    setOpen(true)
  }, [updatePosition])

  const onLeave = useCallback(() => {
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    const onScrollOrResize = () => updatePosition()
    window.addEventListener("scroll", onScrollOrResize, true)
    window.addEventListener("resize", onScrollOrResize)
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true)
      window.removeEventListener("resize", onScrollOrResize)
    }
  }, [open, updatePosition])

  if (!def) return <>{children}</>

  const tooltip = open && typeof document !== "undefined" ? (
    createPortal(
      <div
        role="tooltip"
        className="pointer-events-none relative rounded-lg bg-gray-900 text-white text-xs px-3 py-2.5 shadow-xl whitespace-normal text-center"
        style={style}
      >
        <span className="block font-semibold mb-0.5">{def.label}</span>
        <span className="text-gray-300 leading-snug">{def.description}</span>
        {placement === "top" ? (
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        ) : (
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
        )}
      </div>,
      document.body
    )
  ) : null

  return (
    <>
      <span
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
      >
        <span className="border-b border-dashed border-gray-400 cursor-help">{children}</span>
      </span>
      {tooltip}
    </>
  )
}
