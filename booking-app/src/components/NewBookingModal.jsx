import { useState } from 'react'
import { format, addMinutes, parseISO, formatISO } from 'date-fns'
import { useBusiness } from '../context/BusinessContext.jsx'
import { scoreWorkerForBooking } from '../lib/routing.js'
import Modal from './Modal.jsx'
import { Sparkles } from 'lucide-react'

export default function NewBookingModal({ onClose, initial = {} }) {
  const { clients, services, workers, bookings, addBooking, addClient } = useBusiness()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(() => {
    const defaultDate = format(new Date(Date.now() + 24 * 3600 * 1000), "yyyy-MM-dd'T'09:00")
    return {
      clientId: '',
      newClientName: '',
      newClientPhone: '',
      newClientAddress: '',
      serviceId: services[0]?.id || '',
      startLocal: defaultDate,
      workerIds: [],
      notes: '',
      ...initial,
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

  const save = () => {
    let clientId = form.clientId
    let address = ''
    if (!clientId && form.newClientName) {
      const c = addClient({ name: form.newClientName, phone: form.newClientPhone, address: form.newClientAddress, email: '', tags: [], notes: '' })
      clientId = c.id
      address = c.address
    } else {
      address = clients.find((c) => c.id === clientId)?.address || ''
    }
    if (!clientId || !service) return
    const start = new Date(form.startLocal)
    const end = addMinutes(start, service.durationMin)
    addBooking({
      clientId,
      serviceId: service.id,
      workerIds: form.workerIds,
      start: formatISO(start),
      end: formatISO(end),
      address,
      price: service.basePrice,
      notes: form.notes,
    })
    onClose?.()
  }

  return (
    <Modal
      title="New booking"
      subtitle="Block a slot and assign your crew."
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={save} className="btn-accent" disabled={!form.serviceId || (!form.clientId && !form.newClientName)}>
            Create booking
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="label">Client</label>
          <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
            <option value="">— New client —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {!form.clientId && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input className="input" placeholder="Name" value={form.newClientName} onChange={(e) => setForm({ ...form, newClientName: e.target.value })} />
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
