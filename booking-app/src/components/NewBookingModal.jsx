import { useState } from 'react'
import { format, addMinutes, formatISO } from 'date-fns'
import { useBusiness } from '../context/BusinessContext.jsx'
import { scoreWorkerForBooking } from '../lib/routing.js'
import Modal from './Modal.jsx'
import { Sparkles } from 'lucide-react'

/**
 * Універсальна модалка створення booking.
 *
 * Props:
 *   onClose            закрити без створення
 *   onCreated(id)      called після успішного створення; передає newBookingId
 *   prefill            { clientName, clientPhone, address, serviceId, notes, start, end }
 *                      використовується для:
 *                        - drag-to-create у Calendar (start/end)
 *                        - convert lead → booking у Inbox (всі поля)
 *   initial            (deprecated, для compat — те саме що prefill)
 */
export default function NewBookingModal({ onClose, onCreated, prefill = {}, initial = {} }) {
  const pre = { ...initial, ...prefill }
  const { clients, services, workers, bookings, addBooking, addClient } = useBusiness()

  const [form, setForm] = useState(() => {
    // Стартовий час: prefill > tomorrow 9 AM
    let startLocal
    if (pre.start) {
      const d = new Date(pre.start)
      startLocal = format(d, "yyyy-MM-dd'T'HH:mm")
    } else {
      startLocal = format(new Date(Date.now() + 24 * 3600 * 1000), "yyyy-MM-dd'T'09:00")
    }
    return {
      clientId: '',
      newClientName: pre.clientName || '',
      newClientPhone: pre.clientPhone || '',
      newClientAddress: pre.address || '',
      serviceId: pre.serviceId || services[0]?.id || '',
      startLocal,
      workerIds: [],
      notes: pre.notes || '',
    }
  })

  const service = services.find((s) => s.id === form.serviceId)

  const suggestWorkers = () => {
    if (!service) return
    const startISO = new Date(form.startLocal).toISOString()
    const day = startISO.slice(0, 10)
    const todays = bookings.filter((b) => b.start.startsWith(day))
    const ranked = [...workers].sort(
      (a, b) => scoreWorkerForBooking(b, service, todays) - scoreWorkerForBooking(a, service, todays)
    )
    setForm((f) => ({ ...f, workerIds: ranked.slice(0, 2).map((w) => w.id) }))
  }

  const toggleWorker = (id) => {
    setForm((f) => ({
      ...f,
      workerIds: f.workerIds.includes(id) ? f.workerIds.filter((x) => x !== id) : [...f.workerIds, id],
    }))
  }

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      let clientId = form.clientId
      let address = ''
      if (!clientId && form.newClientName) {
        const c = await addClient({
          name: form.newClientName,
          phone: form.newClientPhone,
          address: form.newClientAddress,
          email: '', tags: [], notes: '',
        })
        if (!c) throw new Error('Failed to create client')
        clientId = c.id
        address = c.address || ''
      } else {
        address = clients.find((c) => c.id === clientId)?.address || ''
      }
      if (!clientId || !service) throw new Error('Missing client or service')
      const start = new Date(form.startLocal)
      const end = addMinutes(start, service.durationMin)
      const created = await addBooking({
        clientId,
        serviceId: service.id,
        workerIds: form.workerIds,
        start: formatISO(start),
        end: formatISO(end),
        address,
        price: service.basePrice,
        notes: form.notes,
      })
      onCreated?.(created?.id)
      onClose?.()
    } catch (e) {
      setError(e.message || 'Could not create booking.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="New booking"
      subtitle="Block a slot and assign your crew."
      onClose={onClose}
      footer={
        <>
          {error && <span className="mr-auto text-sm text-rose-700">{error}</span>}
          {!error && !form.clientId && !form.newClientName && (
            <span className="mr-auto text-xs text-ink-400">Add a client name to enable</span>
          )}
          <button onClick={onClose} className="btn-ghost" disabled={saving}>Cancel</button>
          <button
            onClick={save}
            className="btn-accent"
            disabled={saving || !form.serviceId || (!form.clientId && !form.newClientName)}
          >
            {saving ? 'Creating…' : 'Create booking'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-amber/40 bg-amber-soft/40 p-4">
          <label className="label">Client <span className="text-rose-700">*</span></label>
          <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, newClientName: '' })}>
            <option value="">— New client (fill in below) —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {!form.clientId && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input className="input" placeholder="Name (required)" value={form.newClientName} onChange={(e) => setForm({ ...form, newClientName: e.target.value })} autoFocus />
              <input className="input" placeholder="Phone" value={form.newClientPhone} onChange={(e) => setForm({ ...form, newClientPhone: e.target.value })} />
              <input className="input sm:col-span-2" placeholder="Address" value={form.newClientAddress} onChange={(e) => setForm({ ...form, newClientAddress: e.target.value })} />
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Service</label>
            <select className="input" value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name} — ${s.basePrice}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Start time</label>
            <input
              type="datetime-local"
              className="input"
              value={form.startLocal}
              onChange={(e) => setForm({ ...form, startLocal: e.target.value })}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label !mb-0">Assigned workers</label>
            <button onClick={suggestWorkers} className="inline-flex items-center gap-1 text-xs font-medium text-amber-deep hover:underline">
              <Sparkles size={13} /> AI suggest
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {workers.map((w) => {
              const on = form.workerIds.includes(w.id)
              return (
                <button
                  key={w.id}
                  onClick={() => toggleWorker(w.id)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${on ? 'border-ink-800 bg-ink-800 text-ink-50' : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'}`}
                >
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: w.color }} />
                  {w.name}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input min-h-[80px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
    </Modal>
  )
}
