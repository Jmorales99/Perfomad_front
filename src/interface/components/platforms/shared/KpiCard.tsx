import { Card, CardContent } from "@/components/ui/card"
import type { ReactNode } from "react"

interface KpiCardProps {
  label: ReactNode
  value: string
  sub?: string
  icon: ReactNode
  accent?: "blue" | "green" | "purple" | "orange" | "red"
}

const ACCENT_CLASSES: Record<string, string> = {
  blue: "text-blue-600 bg-blue-50",
  green: "text-green-600 bg-green-50",
  purple: "text-purple-600 bg-purple-50",
  orange: "text-orange-600 bg-orange-50",
  red: "text-red-600 bg-red-50",
}

export default function KpiCard({ label, value, sub, icon, accent = "blue" }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-1">
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5 ${ACCENT_CLASSES[accent]}`}
          >
            {icon}
          </div>
        </div>
        <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}
