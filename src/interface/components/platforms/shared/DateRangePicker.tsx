import { toISODate } from "./formatters"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  since: string
  until: string
  onChange: (range: { since: string; until: string }) => void
  /** Match toolbar controls (AccountSelector, buttons). Default: compact h-9. */
  className?: string
}

const inputClass = cn(
  "box-border h-9 w-[8.75rem] shrink-0 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-800 shadow-sm",
  "[color-scheme:light]",
  "focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
)

export default function DateRangePicker({
  since,
  until,
  onChange,
  className,
}: DateRangePickerProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-sm",
        className
      )}
    >
      <input
        type="date"
        value={since}
        max={until}
        onChange={(e) => onChange({ since: e.target.value, until })}
        className={inputClass}
      />
      <span className="shrink-0 px-0.5 text-xs text-gray-400" aria-hidden>
        →
      </span>
      <input
        type="date"
        value={until}
        min={since}
        max={toISODate(new Date())}
        onChange={(e) => onChange({ since, until: e.target.value })}
        className={inputClass}
      />
    </div>
  )
}
