import { useState } from 'react'
import { MapPin, Phone, Trash2, User } from 'lucide-react'
import Modal from './Modal.jsx'
import StatusPill from './StatusPill.jsx'
import { WorkerStack } from './WorkerAvatar.jsx'
import { useBusiness } from '../context/BusinessContext.jsx'
import { fmtDateTime, fmtMoney } from '../lib/format.js'

const STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled']

export default function BookingDetailModal({ booking, onClose }) {
  const { clients, services, workers, updateBooking, removeBooking } = useBusiness()
  const client = clients.find((c) => c.id === booking.clientId)
  const service = services.find((s) => s.id === booking.serviceId)
  const assigned = workers.filter((w) => booking.workerIds?.includes(w.id))
  const [notes, setNotes] = useState(booking.notes || '')

  return (
    <Modal
      title={client?.name || 'Booking'}
      subtitle={service?.name}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={() => { if (confirm('Delete this booking?')) { removeBooking(booking.id); onClose() } }}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-rose-700 hover:bg-rose-50"
          >
            <Trash2 size={14} /> Delete
          </button>
          <div className="flex-1" />
          <button onClick={() => { updateBooking(booking.id, { notes }); onClose() }} className="btn-accent">Save</button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Info icon={User}    label="Client"   value={client?.name} />
          <Info icon={Phone}   label="Phone"    value={client?.phone} />
          <Info icon={MapPin}  label="Address"  value={booking.address} />
          <Info               label="When"     value={`${fmtDateTime(booking.start)} → ${fmtDateTime(booking.end).split('·')[1]?.trim()}`} />
          <Info               label="Price"    value={fmtMoney(booking.price)} />
          <Info               label="Crew">
            <WorkerStack workers={assigned} />
          </Info>
        </div>

        <div>
          <label className="label">Status</label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => updateBooking(booking.id, { status: s })}
                className={`rounded-full px-3 py-1.5 text-sm transition ${booking.status === s ? 'bg-ink-800 text-ink-50' : 'border border-ink-200 bg-white text-ink-600 hover:bg-ink-50'}`}
              >
                <StatusPill status={s} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input min-h-[90px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

function Info({ icon: Icon, label, value, children }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-3">
      <div className="text-[11px] uppercase tracking-wider text-ink-400">{label}</div>
      <div className="mt-1 flex items-center gap-2 text-sm text-ink-700">
        {Icon && <Icon size={14} className="text-ink-400" />}
        {children || <span>{value || '—'}</span>}
      </div>
    </div>
  )
}
