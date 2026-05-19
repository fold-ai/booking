import { useState } from 'react'
import { Plus, Mail, Phone, Trash2 } from 'lucide-react'
import { useBusiness } from '../context/BusinessContext.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'
import WorkerAvatar from '../components/WorkerAvatar.jsx'

const COLORS = ['#3F6B4A', '#F4A93C', '#B97A1D', '#1F3A26', '#3F3F37', '#7C2D12', '#0F766E']

export default function Workers() {
  const { workers, bookings, addWorker, removeWorker } = useBusiness()
  const [adding, setAdding] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl text-ink-800">Workers</h1>
          <p className="mt-1 text-ink-500">Your crew. Their shared calendar lives here.</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-accent"><Plus size={16} /> Add worker</button>
      </div>

      {workers.length === 0 ? (
        <EmptyState
          title="No workers yet"
          description="Add your crew so jobs can be assigned and shared."
          action={<button onClick={() => setAdding(true)} className="btn-accent"><Plus size={16} /> Add your first worker</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((w) => {
            const upcoming = bookings.filter((b) => b.workerIds?.includes(w.id) && new Date(b.start) >= new Date()).length
            return (
              <div key={w.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <WorkerAvatar worker={w} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-xl text-ink-800">{w.name}</div>
                    <div className="text-xs text-ink-400">{w.role}</div>
                  </div>
                  <button
                    onClick={() => { if (confirm(`Remove ${w.name}?`)) removeWorker(w.id) }}
                    className="rounded-full p-1.5 text-ink-300 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {w.email && <div className="flex items-center gap-2 text-ink-500"><Mail size={13} /> {w.email}</div>}
                  {w.phone && <div className="flex items-center gap-2 text-ink-500"><Phone size={13} /> {w.phone}</div>}
                </div>
                {w.skills?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {w.skills.map((s) => <span key={s} className="chip">{s}</span>)}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 text-xs text-ink-400">
                  <span>Upcoming</span>
                  <span className="font-semibold text-ink-700">{upcoming} jobs</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {adding && (
        <AddWorker
          onClose={() => setAdding(false)}
          onSave={(w) => { addWorker(w); setAdding(false) }}
          existingColors={workers.map((w) => w.color)}
        />
      )}
    </div>
  )
}

function AddWorker({ onClose, onSave, existingColors }) {
  const [form, setForm] = useState({
    name: '', role: 'Crew', email: '', phone: '',
    color: COLORS.find((c) => !existingColors.includes(c)) || COLORS[0],
    skills: '',
  })
  return (
    <Modal
      title="Add worker"
      subtitle="They'll appear on the shared calendar and can be assigned to jobs."
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button
            onClick={() => onSave({ ...form, skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean) })}
            disabled={!form.name}
            className="btn-accent"
          >
            Add worker
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></div>
          <div><label className="label">Role</label><input className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
        <div>
          <label className="label">Calendar color</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setForm({ ...form, color: c })}
                style={{ background: c }}
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-white ${form.color === c ? 'ring-ink-800' : 'ring-transparent'}`}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="label">Skills (comma separated)</label>
          <input className="input" placeholder="Mowing, Hedges, Mulch" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
        </div>
      </div>
    </Modal>
  )
}
