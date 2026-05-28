// Pure payroll math + period helpers. All money is rounded to cents here so
// the rest of the app never deals with floating-point drift.

import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, format, parseISO,
} from 'date-fns'

const WEEK_OPTS = { weekStartsOn: 1 } // Monday

export const roundCents = (n) => Math.round((Number(n) || 0) * 100) / 100

// hours × hourly rate → dollars (cents-accurate). Non-hourly pay types
// contribute 0 here for now (schema supports them; UI is hourly-only).
export const earningsFor = (hours, rate) => roundCents((Number(hours) || 0) * (Number(rate) || 0))

export const ymd = (d) => format(d, 'yyyy-MM-dd')

// Preset → inclusive { start: Date, end: Date }.
export function periodRange(preset, custom) {
  const now = new Date()
  switch (preset) {
    case 'last_week': {
      const d = subWeeks(now, 1)
      return { start: startOfWeek(d, WEEK_OPTS), end: endOfWeek(d, WEEK_OPTS) }
    }
    case 'this_month':
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'custom':
      return {
        start: custom?.start ? parseISO(custom.start) : startOfMonth(now),
        end: custom?.end ? parseISO(custom.end) : endOfMonth(now),
      }
    case 'this_week':
    default:
      return { start: startOfWeek(now, WEEK_OPTS), end: endOfWeek(now, WEEK_OPTS) }
  }
}

export const PERIOD_PRESETS = [
  { value: 'this_week', label: 'This week' },
  { value: 'last_week', label: 'Last week' },
  { value: 'this_month', label: 'This month' },
  { value: 'custom', label: 'Custom' },
]

// entry_date / paid_on are 'YYYY-MM-DD' strings — compare lexically (day-inclusive).
export const dayInRange = (dayStr, start, end) =>
  !!dayStr && dayStr >= ymd(start) && dayStr <= ymd(end)

// Sum hours for entries within [start,end].
export const sumHours = (entries, start, end) =>
  roundCents(entries.filter((e) => dayInRange(e.date, start, end)).reduce((acc, e) => acc + (Number(e.hours) || 0), 0))

// Sum payout amounts within [start,end].
export const sumPaid = (payouts, start, end) =>
  roundCents(payouts.filter((p) => dayInRange(p.paidOn, start, end)).reduce((acc, p) => acc + (Number(p.amount) || 0), 0))

// Per-worker rollup for a period. `balanceOwed` is LIFETIME (all earned −
// all paid), which is the running balance a manager cares about; the other
// figures are scoped to the selected period.
export function workerSummary({ worker, timeEntries, payouts, start, end }) {
  const myEntries = timeEntries.filter((e) => e.workerId === worker.id)
  const myPayouts = payouts.filter((p) => p.workerId === worker.id)
  const rate = Number(worker.hourlyRate) || 0

  const hours = sumHours(myEntries, start, end)
  const earned = earningsFor(hours, rate)
  const paid = sumPaid(myPayouts, start, end)

  const lifetimeHours = roundCents(myEntries.reduce((a, e) => a + (Number(e.hours) || 0), 0))
  const lifetimeEarned = earningsFor(lifetimeHours, rate)
  const lifetimePaid = roundCents(myPayouts.reduce((a, p) => a + (Number(p.amount) || 0), 0))
  const balanceOwed = roundCents(lifetimeEarned - lifetimePaid)

  return { worker, rate, hours, earned, paid, balanceOwed, lifetimeEarned, lifetimePaid }
}

// CSV for the selected period. Columns: worker, date, hours, source, booking ref, earnings.
export function buildPayrollCsv({ workers, timeEntries, start, end, bookingRef }) {
  const header = ['Worker', 'Date', 'Hours', 'Source', 'Booking', 'Earnings']
  const rows = [header]
  const byId = Object.fromEntries(workers.map((w) => [w.id, w]))

  timeEntries
    .filter((e) => dayInRange(e.date, start, end))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .forEach((e) => {
      const w = byId[e.workerId]
      const rate = Number(w?.hourlyRate) || 0
      rows.push([
        w?.name ?? 'Unknown',
        e.date,
        String(e.hours ?? 0),
        e.source,
        e.bookingId ? (bookingRef?.(e.bookingId) ?? e.bookingId) : '',
        earningsFor(e.hours, rate).toFixed(2),
      ])
    })

  return rows
    .map((r) => r.map(csvCell).join(','))
    .join('\r\n')
}

const csvCell = (v) => {
  const s = String(v ?? '')
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Trigger a client-side CSV download.
export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
