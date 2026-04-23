import { forwardRef, useEffect, useRef, useState } from "react"

/**
 * Parses a localized number string into a number.
 *
 * Handles:
 *   - "1.234,56" (es-ES, es-CL) → 1234.56
 *   - "1,234.56" (en-US)        → 1234.56
 *   - "1500"                    → 1500
 *   - "1500,5"                  → 1500.5
 *   - "1500.5"                  → 1500.5
 *   - ""                        → null
 *   - "abc"                     → null (never NaN)
 *
 * Heuristic: the LAST dot or comma is treated as the decimal separator,
 * any earlier occurrences are thousand separators and are stripped.
 */
export function parseLocalNumber(raw: string): number | null {
  if (raw == null) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null

  // Strip whitespace and anything that isn't a digit, dot, comma, minus
  const cleaned = trimmed.replace(/[^\d.,-]/g, "")
  if (!cleaned) return null

  // Find the last separator — that's the decimal
  const lastDot = cleaned.lastIndexOf(".")
  const lastComma = cleaned.lastIndexOf(",")
  const decimalPos = Math.max(lastDot, lastComma)

  let normalized: string
  if (decimalPos === -1) {
    // No separators at all
    normalized = cleaned
  } else {
    const decimalSep = cleaned[decimalPos]
    const integerPart = cleaned
      .slice(0, decimalPos)
      // strip the OTHER separator (thousand grouping)
      .replace(new RegExp(`[${decimalSep === "." ? "," : "\\."}]`, "g"), "")
      // also strip any stray other-decimal that isn't at the current position
      .replace(/[.,]/g, "")
    const decimalPart = cleaned.slice(decimalPos + 1).replace(/[.,]/g, "")
    normalized = decimalPart ? `${integerPart}.${decimalPart}` : integerPart
  }

  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number | null | undefined
  onChange: (value: number | null) => void
  /** Number of decimal places to display on blur. Default: 2. */
  decimals?: number
  /** Display prefix ($, €, etc.). */
  prefix?: string
  /** Minimum (inclusive). */
  min?: number
  /** Maximum (inclusive). */
  max?: number
}

/**
 * Controlled number input that accepts locale-mixed notation ("1.234,56" or
 * "1,234.56") and emits a plain `number` via onChange. Keeps the user's raw
 * text while they type to preserve in-progress decimal separators, then
 * normalizes on blur.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      decimals = 2,
      prefix,
      min,
      max,
      className = "",
      onBlur,
      ...rest
    },
    ref
  ) => {
    const [text, setText] = useState<string>(
      value != null ? String(value) : ""
    )
    /**
     * True while the user is actively typing — used to prevent the `value`
     * prop change (which we ourselves just emitted via onChange) from
     * overwriting the in-progress text (e.g. stripping a trailing "." or
     * replacing "0" with the clamped "1").
     */
    const isTypingRef = useRef(false)

    // Sync text from external value changes ONLY when the user isn't
    // currently typing. This covers form.reset() / programmatic changes
    // without fighting user input.
    useEffect(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false
        return
      }
      setText(value != null ? String(value) : "")
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      setText(v)
      isTypingRef.current = true
      const parsed = parseLocalNumber(v)
      if (parsed != null) {
        // NO clamping here — respect whatever the user is typing mid-edit
        // so "0" (starting "0.50") or "5" (aiming for "50") don't get
        // rewritten. Clamping happens on blur below.
        onChange(parsed)
      } else if (v === "") {
        onChange(null)
      }
      // else: mid-typing garbage (e.g. "."); keep text, don't fire onChange
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const parsed = parseLocalNumber(text)
      if (parsed == null) {
        setText(value != null ? value.toFixed(decimals) : "")
      } else {
        // Clamp to bounds on blur so the final committed value respects min/max.
        let clamped = parsed
        if (min != null && clamped < min) clamped = min
        if (max != null && clamped > max) clamped = max
        setText(clamped.toFixed(decimals))
        if (clamped !== value) onChange(clamped)
      }
      onBlur?.(e)
    }

    const inputEl = (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 ${prefix ? "pl-7" : ""} ${className}`}
        {...rest}
      />
    )

    if (!prefix) return inputEl
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
          {prefix}
        </span>
        {inputEl}
      </div>
    )
  }
)
NumberInput.displayName = "NumberInput"
