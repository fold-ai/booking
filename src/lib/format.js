import { format, isToday, isTomorrow, parseISO } from 'date-fns'

export const fmtDate = (iso) => {
  const d = typeof iso === 'string' ? parseISO(iso) : iso
  return format(d, 'EEE, MMM d')
}

export const fmtTime = (iso) => {
  const d = typeof iso === 'string' ? parseISO(iso) : iso
  return format(d, 'h:mm a')
}

export const fmtDateTime = (iso) => `${fmtDate(iso)} · ${fmtTime(iso)}`

export const fmtDayLabel = (iso) => {
  const d = typeof iso === 'string' ? parseISO(iso) : iso
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'EEEE, MMMM d')
}

export const fmtMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)

// Payroll needs cents (e.g. 12.5h × $25 = $312.50), so this keeps 2 decimals.
export const fmtPay = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0)

// Hours as "12h", "30m", or "12h 30m".
export const fmtHours = (h) => {
  const total = Math.round((Number(h) || 0) * 60)  // total minutes, avoids float drift
  const whole = Math.floor(total / 60)
  const mins = total % 60
  if (whole === 0 && mins === 0) return '0h'
  if (mins === 0) return `${whole}h`
  if (whole === 0) return `${mins}m`
  return `${whole}h ${mins}m`
}

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('')
