export type StatusFilterValue = "all" | "active" | "paused" | "issues"

const STATUS_LABELS: Record<StatusFilterValue, string> = {
  all: "Todas",
  active: "Activas",
  paused: "Pausadas",
  issues: "Con problemas",
}

interface StatusFilterProps {
  value: StatusFilterValue
  onChange: (value: StatusFilterValue) => void
  /** Accent color for the active pill. Defaults to blue. */
  accentColor?: "blue" | "red"
}

export function StatusFilter({ value, onChange, accentColor = "blue" }: StatusFilterProps) {
  const activeClass =
    accentColor === "red"
      ? "bg-red-600 text-white shadow-sm"
      : "bg-blue-600 text-white shadow-sm"

  return (
    <div className="flex items-center gap-0.5 bg-gray-100 border border-gray-200 rounded-lg p-0.5">
      {(Object.keys(STATUS_LABELS) as StatusFilterValue[]).map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            value === opt ? activeClass : "text-gray-500 hover:text-gray-700 hover:bg-white/70"
          }`}
        >
          {STATUS_LABELS[opt]}
        </button>
      ))}
    </div>
  )
}

/**
 * Returns true if the given raw or normalized campaign status matches the filter.
 * Handles normalized buckets ('active','paused','issues','removed','unknown') and
 * legacy raw formats ('ACTIVE','PAUSED','ENABLED','ARCHIVED','WITH_ISSUES',...).
 */
export function matchesStatusFilter(status: string | undefined, filter: StatusFilterValue): boolean {
  if (filter === "all") return true
  const normalized = (status ?? "unknown").toLowerCase()
  const mapped =
    normalized === "active" || normalized === "enabled" || normalized === "eligible" ? "active"
    : normalized === "paused" ? "paused"
    : normalized === "issues"
      || normalized === "with_issues"
      || normalized === "pending_review"
      || normalized === "pending_billing_info"
      || normalized === "disapproved"
      || normalized === "misconfigured"
      || normalized === "not_eligible"
      || normalized === "limited"
      || normalized === "pending" ? "issues"
    : normalized === "removed" || normalized === "archived" || normalized === "deleted" ? "removed"
    : "unknown"
  return mapped === filter
}
