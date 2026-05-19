import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useBusiness } from '../context/BusinessContext.jsx'
import { fmtMoney } from '../lib/format.js'
import Modal from '../components/Modal.jsx'

export default function Services() {
  const { services, addService, updateService, removeService } = useBusiness()
  const [adding, setAdding] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl text-ink-800">Services</h1>
          <p className="mt-1 text-ink-500">The menu your customers can book from.</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-accent"><Plus size={16} /> Add service</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((s) => (
          <div key={s.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-display text-2xl text-ink-800">{s.name}</div>
                <div className="mt-1 text-sm text-ink-400">{s.durationMin} min · per {s.unit}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl text-amber-deep">{fmtMoney(s.basePrice)}</div>
                <label className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-500">
                  <input type="checkbox" checked={s.active !== false} onChange={(e) => updateService(s.id, { active: e.target.checked })} />
                  Active
                </label>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-ink-400">
              <span>ID · {s.id}</span>
              <button onClick={() => { if (confirm(`Remove "${s.name}"?`)) removeService(s.id) }} className="inline-flex items-center gap-1 text-rose-700 hover:underline"><Trash2 size={12} /> Remove</button>
            </div>
          </div>
        ))}
      </div>

      {adding && <AddService onClose={() => setAdding(false)} onSave={(s) => { addService(s); setAdding(false) }} />}
    </div>
  )
}

function AddService({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', durationMin: 60, basePrice: 100, unit: 'visit', active: true })
  return (
    <Modal
      title="Add service"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.name} className="btn-accent">Save service</button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></div>
        <div><label className="label">Duration (min)</label><input className="input" type="number" min="15" step="15" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: +e.target.value })} /></div>
        <div><label className="label">Base price ($)</label><input className="input" type="number" min="0" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: +e.target.value })} /></div>
        <div className="sm:col-span-2"><label className="label">Unit</label>
          <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            <option value="visit">visit</option>
            <option value="hour">hour</option>
            <option value="sqft">sq ft</option>
            <option value="yard">yard</option>
          </select>
        </div>
      </div>
    </Modal>
  )
}
