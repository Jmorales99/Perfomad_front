export interface AccountOption {
  id: string
  label: string
  currency?: string
}

interface AccountSelectorProps {
  options: AccountOption[]
  value: string | null
  onChange: (id: string) => void
  placeholder?: string
}

export default function AccountSelector({
  options,
  value,
  onChange,
  placeholder = "Cuenta publicitaria",
}: AccountSelectorProps) {
  if (options.length === 0) return null

  if (options.length === 1) {
    const only = options[0]
    return (
      <div className="inline-flex h-9 max-w-full shrink-0 items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 text-sm text-gray-700">
        <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
        <strong className="truncate font-semibold">{only.label}</strong>
        {only.currency && (
          <span className="shrink-0 text-gray-400">· {only.currency}</span>
        )}
      </div>
    )
  }

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 min-w-[12rem] max-w-[min(100vw,20rem)] shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((a) => (
        <option key={a.id} value={a.id}>
          {a.label}
          {a.currency ? ` · ${a.currency}` : ""}
        </option>
      ))}
    </select>
  )
}
