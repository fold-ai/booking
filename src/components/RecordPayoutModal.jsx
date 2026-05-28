import { useState } from 'react'
import { format } from 'date-fns'
import Modal from './Modal.jsx'

const today = () => format(new Date(), 'yyyy-MM-dd')
const METHODS = ['cash', 'check', 'venmo', 'zelle', 'other']

// Record or edit a payout. `payout` present → edit mode. `defaultPeriod`
// ({start,end} as Date) prefills the "period covered" fields.
export default function RecordPayoutModal({ workers, fixedWorkerId, payout, defaultPeriod, onClose, onSave }) {
  const editing = !!payout
  const [form, setForm] = useState({
    workerId: payout?.workerId ?? fixedWorkerId ?? workers[0]?.id ?? '',
    amount: payout?.amount != null ? String(payout.amount) : '',
    paidOn: payout?.paidOn ?? today(),
    method: payout?.method ?? 'venmo',
    notes: payout?.notes ?? '',
    periodStart: payout?.periodStart ?? (defaultPeriod ? format(defaultPeriod.start, 'yyyy-MM-dd') : ''),
    periodEnd: payout?.periodEnd ?? (defaultPeriod ? format(defaultPeriod.end, 'yyyy-MM-dd') : ''),
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    const amount = Number(form.amount)
    if (!form.workerId) return setError('Pick a worker.')
    if (!Number.isFinite(amount) || amount <= 0) return setError('Enter an amount greater than 0.')
    if (!form.paidOn) return setError('Pick the date paid.')
    setBusy(true)
    try {
      await onSave({
        workerId: form.workerId,
        amount: Math.round(amount * 100) / 100,
        paidOn: form.paidOn,
        method: form.method,
        notes: form.notes.trim() || null,
        periodStart: form.periodStart || null,
        periodEnd: form.periodEnd || null,
      })
    } catch (e) {
      setError(e.message || 'Could not record the payout.')
      setBusy(false)
    }
  }

  return (
    <Modal
      title={editing ? 'Edit payout' : 'Record a payout'}
      subtitle="Log money you've actually paid this worker. The balance owed updates automatically."
      onClose={onClose}
      footer={
        <>
          {error && <span className="mr-auto text-sm text-rose-700">{error}</span>}
          <button onClick={onClose} className="btn-ghost" disabled={busy}>Cancel</button>
          <button onClick={submit} className="btn-accent" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Record payout'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {!fixedWorkerId && (
          <div>
            <label className="label">Worker</label>
            <select className="input" value={form.workerId} onChange={(e) => setForm({ ...form, workerId: e.target.value })}>
              {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Amount ($)</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="1200.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="label">Date paid</label>
            <input className="input" type="date" value={form.paidOn} onChange={(e) => setForm({ ...form, paidOn: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Method</label>
          <select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
            {METHODS.map((m) => <option key={m} value={m}>{m[0].toUpperCase() + m.slice(1)}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Period covered (optional)</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
            <input className="input" type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <input className="input" placeholder="e.g. Venmo, week of May 12" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
    </Modal>
  )
}
