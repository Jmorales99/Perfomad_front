export function toNum(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

export function fmt(n: unknown, decimals = 0): string {
  const num = toNum(n)
  if (num === null) return "—"
  return num.toLocaleString("es-CL", { maximumFractionDigits: decimals })
}

export function fmtCurrency(n: unknown, currency = "USD"): string {
  const num = toNum(n)
  if (num === null) return "—"
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(num)
}

export function fmtPct(n: unknown, decimals = 2): string {
  const num = toNum(n)
  if (num === null) return "—"
  return `${num.toFixed(decimals)}%`
}

export function fmtMultiplier(n: unknown, decimals = 2): string {
  const num = toNum(n)
  if (num === null) return "—"
  return `${num.toFixed(decimals)}x`
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function defaultSince(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return toISODate(d)
}

export function defaultUntil(): string {
  return toISODate(new Date())
}

export function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}K`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `$${(n / 1_000).toFixed(0)}K`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}
