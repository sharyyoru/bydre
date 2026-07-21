const aedFormatter = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
})

const aedCompactFormatter = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  notation: "compact",
  maximumFractionDigits: 1,
})

const numberFormatter = new Intl.NumberFormat("en-AE")

export function formatAED(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—"
  return aedFormatter.format(value)
}

export function formatAEDCompact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—"
  return aedCompactFormatter.format(value)
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—"
  return numberFormatter.format(value)
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—"
  return `${value.toFixed(1)}%`
}
