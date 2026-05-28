import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Wallet, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useBusiness } from '../context/BusinessContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import EmptyState from '../components/EmptyState.jsx'
import AddTimeEntryModal from '../components/AddTimeEntryModal.jsx'
import RecordPayoutModal from '../components/RecordPayoutModal.jsx'
import { fmtPay, fmtHours, fmtDate } from '../lib/format.js'
import { PERIOD_PRESETS, periodRange, workerSummary, dayInRange } from '../lib/payroll.js'

export default function PayrollWorker() {
  const { workerId } = useParams()
  const { user } = useAuth()
  const {
    workers, bookings, clients, timeEntries, payouts, isManager,
    addTimeEntry, updateTimeEntry, removeTimeEntry,
    addPayout, updatePayout, removePayout,
  } = useBusiness()
  const nav = useNavigate()

  const [preset, setPreset] = useState('this_month')
  const [custom, setCustom] = useState({ start: '', end: '' })
  const [editingEntry, setEditingEntry] = useState(null)  // entry | 'new'
  const [editingPayout, setEditingPayout] = useState(null) // payout | 'new'

  const { start, end } = useMemo(() => periodRange(preset, custom), [preset, custom])
  const worker = workers.find((w) => w.id === workerId)

  const summary = useMemo(
    () => (worker ? workerSummary({ worker, timeEntries, payouts, start, end }) : null),
    [worker, timeEntries, payouts, start, end],
  )

  const entries = useMemo(
    () => timeEntries
      .filter((e) => e.workerId === workerId && dayInRange(e.date, start, end))
      .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [timeEntries, workerId, start, end],
  )
  const periodPayouts = useMemo(
    () => payouts
      .filter((p) => p.workerId === workerId && dayInRange(p.paidOn, start, end))
      .sort((a, b) => (a.paidOn < b.paidOn ? 1 : -1)),
    [payouts, workerId, start, end],
  )

  // A non-manager may only view their own detail.
  const myWorker = workers.find((w) => w.userId === user?.id)
  if (!isManager && myWorker && myWorker.id !== workerId) {
    return <Navigate to={`/app/payroll/${myWorker.id}`} replace />
  }
  if (!worker) {
    return <EmptyState title="Worker not found" description="This worker may have been removed." action={<Link to="/app/payroll" className="btn-accent">Back to payroll</Link>} />
  }

  const periodLabel = `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
  const clientName = (id) => clients.find((c) => c.id === id)?.name
  const bookingLabel = (id) => {
    const b = bookings.find((x) => x.id === id)
    if (!b) return 'booking'
    return `${fmtDate(b.start)}${clientName(b.clientId) ? ` · ${clientName(b.clientId)}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => nav('/app/payroll')} className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
          <ArrowLeft size={15} /> Payroll
        </button>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl text-ink-800">{worker.name}</h1>
            <p className="mt-1 text-ink-500">
              {worker.role || 'Crew'} · {worker.hourlyRate != null ? `${fmtPay(worker.hourlyRate)}/hr` : 'No rate set'}
            </p>
          </div>
          {isManager && (
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setEditingEntry('new')} className="btn-ghost"><Plus size={16} /> Time entry</button>
              <button onClick={() => setEditingPayout('new')} className="btn-accent"><Wallet size={16} /> Record payout</button>
            </div>
          )}
        </div>
      </div>

      <PeriodSelector preset={preset} setPreset={setPreset} custom={custom} setCustom={setCustom} periodLabel={periodLabel} />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Hours" value={fmtHours(summary.hours)} />
        <StatCard label="Earned" value={fmtPay(summary.earned)} />
        <StatCard label="Paid" value={fmtPay(summary.paid)} />
        <StatCard label="Balance owed" value={fmtPay(summary.balanceOwed)} accent={summary.balanceOwed > 0} hint="lifetime" />
      </div>

      {/* Time entries */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-display text-xl text-ink-800">Time entries</h2>
          <span className="text-sm text-ink-400">{fmtHours(summary.hours)} · {periodLabel}</span>
        </div>
        {entries.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-ink-400">No hours logged in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-ink-100 text-left text-xs uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium text-right">Hours</th>
                  <th className="px-5 py-2.5 font-medium">Source</th>
                  <th className="px-5 py-2.5 font-medium">Notes</th>
                  {isManager && <th className="px-5 py-2.5" />}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-ink-50">
                    <td className="px-5 py-3 text-ink-700">{fmtDate(e.date)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink-700">{fmtHours(e.hours)}</td>
                    <td className="px-5 py-3">
                      {e.source === 'booking'
                        ? <span className="chip">{e.bookingId ? bookingLabel(e.bookingId) : 'Booking'}</span>
                        : <span className="rounded-full bg-amber-soft px-2.5 py-1 text-xs font-medium text-amber-deep">Manual</span>}
                    </td>
                    <td className="px-5 py-3 text-ink-500">{e.notes || (e.source === 'booking' ? 'Auto from completed booking' : '—')}</td>
                    {isManager && (
                      <td className="px-5 py-3 text-right">
                        {e.source === 'manual' ? (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setEditingEntry(e)} className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"><Pencil size={14} /></button>
                            <button onClick={() => { if (confirm('Delete this time entry?')) removeTimeEntry(e.id) }} className="rounded-full p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={14} /></button>
                          </div>
                        ) : (
                          <span className="text-xs text-ink-300">auto</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payouts */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-display text-xl text-ink-800">Payouts</h2>
          <span className="text-sm text-ink-400">{fmtPay(summary.paid)} · {periodLabel}</span>
        </div>
        {periodPayouts.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-ink-400">No payouts recorded in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-ink-100 text-left text-xs uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium text-right">Amount</th>
                  <th className="px-5 py-2.5 font-medium">Method</th>
                  <th className="px-5 py-2.5 font-medium">Notes</th>
                  {isManager && <th className="px-5 py-2.5" />}
                </tr>
              </thead>
              <tbody>
                {periodPayouts.map((p) => (
                  <tr key={p.id} className="border-b border-ink-50">
                    <td className="px-5 py-3 text-ink-700">{fmtDate(p.paidOn)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink-700">{fmtPay(p.amount)}</td>
                    <td className="px-5 py-3"><span className="chip capitalize">{p.method}</span></td>
                    <td className="px-5 py-3 text-ink-500">{p.notes || '—'}</td>
                    {isManager && (
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditingPayout(p)} className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"><Pencil size={14} /></button>
                          <button onClick={() => { if (confirm('Delete this payout?')) removePayout(p.id) }} className="rounded-full p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editingEntry && (
        <AddTimeEntryModal
          workers={workers}
          bookings={bookings}
          fixedWorkerId={worker.id}
          entry={editingEntry === 'new' ? null : editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={async (e) => {
            if (editingEntry === 'new') await addTimeEntry(e)
            else await updateTimeEntry(editingEntry.id, e)
            setEditingEntry(null)
          }}
        />
      )}
      {editingPayout && (
        <RecordPayoutModal
          workers={workers}
          fixedWorkerId={worker.id}
          payout={editingPayout === 'new' ? null : editingPayout}
          defaultPeriod={{ start, end }}
          onClose={() => setEditingPayout(null)}
          onSave={async (p) => {
            if (editingPayout === 'new') await addPayout(p)
            else await updatePayout(editingPayout.id, p)
            setEditingPayout(null)
          }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, accent, hint }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wider text-ink-400">{label}{hint && <span className="ml-1 normal-case tracking-normal text-ink-300">({hint})</span>}</div>
      <div className={`mt-1 font-display text-2xl ${accent ? 'text-amber-deep' : 'text-ink-800'}`}>{value}</div>
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
