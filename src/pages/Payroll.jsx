import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Plus, Wallet, Download, Printer, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { useBusiness } from '../context/BusinessContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import EmptyState from '../components/EmptyState.jsx'
import AddTimeEntryModal from '../components/AddTimeEntryModal.jsx'
import RecordPayoutModal from '../components/RecordPayoutModal.jsx'
import { fmtPay, fmtHours } from '../lib/format.js'
import {
  PERIOD_PRESETS, periodRange, workerSummary, buildPayrollCsv, downloadCsv, roundCents,
} from '../lib/payroll.js'

export default function Payroll() {
  const { user } = useAuth()
  const {
    business, workers, bookings, timeEntries, payouts,
    isManager, updateWorker, addTimeEntry, addPayout,
  } = useBusiness()
  const nav = useNavigate()

  const [preset, setPreset] = useState('this_week')
  const [custom, setCustom] = useState({ start: '', end: '' })
  const [addingTime, setAddingTime] = useState(false)
  const [addingPayout, setAddingPayout] = useState(false)

  const { start, end } = useMemo(() => periodRange(preset, custom), [preset, custom])

  const rows = useMemo(
    () => workers.map((w) => workerSummary({ worker: w, timeEntries, payouts, start, end })),
    [workers, timeEntries, payouts, start, end],
  )

  // Non-managers can only ever see their own data — send them to their detail.
  // (All hooks above run unconditionally; this guard comes after them.)
  const myWorker = workers.find((w) => w.userId === user?.id)
  if (!isManager) {
    return myWorker
      ? <Navigate to={`/app/payroll/${myWorker.id}`} replace />
      : <EmptyState title="No payroll access" description="Payroll is only available to managers." />
  }

  const totals = rows.reduce(
    (acc, r) => ({
      hours: roundCents(acc.hours + r.hours),
      earned: roundCents(acc.earned + r.earned),
      paid: roundCents(acc.paid + r.paid),
      balance: roundCents(acc.balance + r.balanceOwed),
    }),
    { hours: 0, earned: 0, paid: 0, balance: 0 },
  )

  const periodLabel = `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
  const bookingRef = (id) => {
    const b = bookings.find((x) => x.id === id)
    return b ? format(new Date(b.start), 'yyyy-MM-dd') : id
  }

  const exportCsv = () => {
    const csv = buildPayrollCsv({ workers, timeEntries, start, end, bookingRef })
    downloadCsv(`payroll_${format(start, 'yyyy-MM-dd')}_${format(end, 'yyyy-MM-dd')}.csv`, csv)
  }

  const printSummary = () => printPayrollSummary({ businessName: business?.name, periodLabel, rows })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-ink-800">Payroll</h1>
          <p className="mt-1 text-ink-500">Hours worked and what each worker has earned vs been paid.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={exportCsv} className="btn-ghost"><Download size={16} /> Export CSV</button>
          <button onClick={printSummary} className="btn-ghost"><Printer size={16} /> Print</button>
          <button onClick={() => setAddingTime(true)} className="btn-ghost"><Plus size={16} /> Time entry</button>
          <button onClick={() => setAddingPayout(true)} className="btn-accent"><Wallet size={16} /> Record payout</button>
        </div>
      </div>

      <PeriodSelector preset={preset} setPreset={setPreset} custom={custom} setCustom={setCustom} periodLabel={periodLabel} />

      {workers.length === 0 ? (
        <EmptyState
          title="No workers yet"
          description="Add your crew on the Workers page, then their hours and pay will show up here."
          action={<button onClick={() => nav('/app/workers')} className="btn-accent">Go to Workers</button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-400">
                  <th className="px-4 py-3 font-medium">Worker</th>
                  <th className="px-4 py-3 font-medium">Rate</th>
                  <th className="px-4 py-3 font-medium text-right">Hours</th>
                  <th className="px-4 py-3 font-medium text-right">Earned</th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                  <th className="px-4 py-3 font-medium text-right">Balance owed</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.worker.id}
                    className="cursor-pointer border-b border-ink-50 transition hover:bg-ink-50"
                    onClick={() => nav(`/app/payroll/${r.worker.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-ink-800">{r.worker.name}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <RateInput worker={r.worker} onSave={(rate) => updateWorker(r.worker.id, { hourlyRate: rate })} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">{fmtHours(r.hours)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">{fmtPay(r.earned)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">{fmtPay(r.paid)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-semibold ${r.balanceOwed > 0 ? 'text-amber-deep' : 'text-ink-500'}`}>
                      {fmtPay(r.balanceOwed)}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-300"><ChevronRight size={16} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-ink-100 bg-ink-50/60 font-semibold text-ink-800">
                  <td className="px-4 py-3" colSpan={2}>Totals · {periodLabel}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtHours(totals.hours)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtPay(totals.earned)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtPay(totals.paid)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtPay(totals.balance)}</td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-ink-400">
        Hours, earned, and paid are for the selected period. <span className="font-medium">Balance owed</span> is the
        running lifetime total (all earned minus all paid).
      </p>

      {addingTime && (
        <AddTimeEntryModal
          workers={workers}
          bookings={bookings}
          onClose={() => setAddingTime(false)}
          onSave={async (e) => { await addTimeEntry(e); setAddingTime(false) }}
        />
      )}
      {addingPayout && (
        <RecordPayoutModal
          workers={workers}
          defaultPeriod={{ start, end }}
          onClose={() => setAddingPayout(false)}
          onSave={async (p) => { await addPayout(p); setAddingPayout(false) }}
        />
      )}
    </div>
  )
}

function PeriodSelector({ preset, setPreset, custom, setCustom, periodLabel }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex rounded-full border border-ink-200 bg-white p-1">
        {PERIOD_PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              preset === p.value ? 'bg-ink-800 text-ink-50' : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === 'custom' ? (
        <div className="flex items-center gap-2">
          <input className="input !w-auto" type="date" value={custom.start} onChange={(e) => setCustom({ ...custom, start: e.target.value })} />
          <span className="text-ink-400">→</span>
          <input className="input !w-auto" type="date" value={custom.end} onChange={(e) => setCustom({ ...custom, end: e.target.value })} />
        </div>
      ) : (
        <span className="text-sm text-ink-400">{periodLabel}</span>
      )}
    </div>
  )
}

// Inline-editable hourly rate. Saves on blur / Enter; reverts on Escape.
function RateInput({ worker, onSave }) {
  const [value, setValue] = useState(worker.hourlyRate != null ? String(worker.hourlyRate) : '')
  const [busy, setBusy] = useState(false)

  const commit = async () => {
    const next = value === '' ? null : Math.round(Number(value) * 100) / 100
    const current = worker.hourlyRate ?? null
    if (next === current || (next != null && !Number.isFinite(next))) return
    setBusy(true)
    try { await onSave(next) } finally { setBusy(false) }
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-ink-400">$</span>
      <input
        className="w-20 rounded-lg border border-ink-200 bg-white px-2 py-1 text-sm text-ink-700 outline-none focus:border-ink-500"
        type="number"
        min="0"
        step="0.01"
        placeholder="0.00"
        value={value}
        disabled={busy}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') { setValue(worker.hourlyRate != null ? String(worker.hourlyRate) : ''); e.currentTarget.blur() }
        }}
      />
      <span className="text-xs text-ink-400">/hr</span>
    </div>
  )
}

// Opens a clean, print-friendly summary in a new window and triggers print.
function printPayrollSummary({ businessName, periodLabel, rows }) {
  const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
  const money = (n) => '$' + (Number(n) || 0).toFixed(2)
  const body = rows.map((r) => `
    <tr>
      <td>${esc(r.worker.name)}</td>
      <td style="text-align:right">${money(r.rate)}/hr</td>
      <td style="text-align:right">${(Number(r.hours) || 0).toFixed(2)}</td>
      <td style="text-align:right">${money(r.earned)}</td>
      <td style="text-align:right">${money(r.paid)}</td>
      <td style="text-align:right">${money(r.balanceOwed)}</td>
    </tr>`).join('')

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Payroll — ${esc(periodLabel)}</title>
    <style>
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1F3A26; padding: 32px; }
      h1 { font-size: 22px; margin: 0 0 4px; }
      .sub { color: #5C5A4E; margin: 0 0 20px; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { padding: 8px 10px; border-bottom: 1px solid #E8E3D2; }
      th { text-align: left; text-transform: uppercase; letter-spacing: .04em; font-size: 11px; color: #5C5A4E; }
    </style></head><body>
    <h1>${esc(businessName || 'Payroll')}</h1>
    <p class="sub">Pay period: ${esc(periodLabel)}</p>
    <table>
      <thead><tr><th>Worker</th><th style="text-align:right">Rate</th><th style="text-align:right">Hours</th><th style="text-align:right">Earned</th><th style="text-align:right">Paid</th><th style="text-align:right">Balance</th></tr></thead>
      <tbody>${body}</tbody>
    </table>
    </body></html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 250)
}
