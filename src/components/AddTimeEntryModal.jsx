import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import Modal from './Modal.jsx'
import { fmtDate, fmtTime } from '../lib/format.js'

const today = () => format(new Date(), 'yyyy-MM-dd')

// Hours between two ISO timestamps, rounded to 2 decimals (>= 0).
const hoursBetween = (startIso, endIso) => {
  try {
    const ms = parseISO(endIso) - parseISO(startIso)
    return Math.max(0, Math.round((ms / 3_600_000) * 100) / 100)
  } catch {
    return 0
  }
}

// Add or edit a MANUAL time entry. `entry` present → edit mode.
export default function AddTimeEntryModal({ workers, bookings = [], fixedWorkerId, entry, onClose, onSave }) {
  const editing = !!entry
  const [form, setForm] = useState({
    workerId: entry?.workerId ?? fixedWorkerId ?? workers[0]?.id ?? '',
    date: entry?.date ?? today(),
    hours: entry?.hours != null ? String(entry.hours) : '',
    bookingId: entry?.bookingId ?? '',
    notes: entry?.notes ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Bookings for the selected worker, most recent first.
  const workerBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.workerIds?.includes(form.workerId))
        .sort((a, b) => (a.start < b.start ? 1 : -1)),
    [bookings, form.workerId],
  )

  const pickBooking = (id) => {
    const b = workerBookings.find((x) => x.id === id)
    setForm((f) => ({
      ...f,
      bookingId: id,
      // prefill date + hours from the booking when empty
      date: b ? format(parseISO(b.start), 'yyyy-MM-dd') : f.date,
      hours: b && !f.hours ? String(hoursBetween(b.start, b.end)) : f.hours,
    }))
  }

  const submit = async () => {
    setError('')
    const hours = Number(form.hours)
    if (!form.workerId) return setError('Pick a worker.')
    if (!form.date) return setError('Pick a date.')
    if (!Number.isFinite(hours) || hours <= 0) return setError('Enter hours greater than 0.')
    setBusy(true)
    try {
      await onSave({
        workerId: form.workerId,
        date: form.date,
        hours: Math.round(hours * 100) / 100,
        bookingId: form.bookingId || null,
        notes: form.notes.trim() || null,
        source: 'manual',
      })
    } catch (e) {
      setError(e.message || 'Could not save the time entry.')
      setBusy(false)
    }
  }

  return (
    <Modal
      title={editing ? 'Edit time entry' : 'Add time entry'}
      subtitle="Log hours manually — travel, shop work, or fixing a booking's time."
      onClose={onClose}
      footer={
        <>
          {error && <span className="mr-auto text-sm text-rose-700">{error}</span>}
          <button onClick={onClose} className="btn-ghost" disabled={busy}>Cancel</button>
          <button onClick={submit} className="btn-accent" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add entry'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {!fixedWorkerId && (
          <div>
            <label className="label">Worker</label>
            <select
              className="input"
              value={form.workerId}
              onChange={(e) => setForm({ ...form, workerId: e.target.value, bookingId: '' })}
            >
              {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Hours</label>
            <input className="input" type="number" min="0" step="0.25" placeholder="2.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
          </div>
        </div>

        {workerBookings.length > 0 && (
          <div>
            <label className="label">Link to a booking (optional)</label>
            <select className="input" value={form.bookingId} onChange={(e) => pickBooking(e.target.value)}>
              <option value="">— none —</option>
              {workerBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {fmtDate(b.start)} · {fmtTime(b.start)} · {b.address || 'job'}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">Notes</label>
          <input className="input" placeholder="e.g. Travel to job site" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
    </Modal>
  )
}
