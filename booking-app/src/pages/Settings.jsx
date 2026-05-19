import { useEffect, useState } from 'react'
import { useBusiness } from '../context/BusinessContext.jsx'
import { BUSINESS_TYPES } from '../data/businessTypes.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Settings() {
  const { business, updateBusiness } = useBusiness()
  const { supabaseReady } = useAuth()
  const [form, setForm] = useState(business)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setForm(business) }, [business])
  if (!form) return null

  const save = async () => {
    setError('')
    try {
      await updateBusiness(form)
      setSaved(true); setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      setError(e.message || 'Save failed.')
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-4xl text-ink-800">Settings</h1>
        <p className="mt-1 text-ink-500">Your workspace, your booking page, your hours.</p>
      </div>

      <section className="card p-6">
        <h2 className="font-display text-2xl text-ink-800">Workspace</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Business name</label><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div>
            <label className="label">Industry</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {BUSINESS_TYPES.map((b) => <option key={b.id} value={b.id}>{b.emoji} {b.label}</option>)}
            </select>
          </div>
          <div><label className="label">City</label><input className="input" value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="sm:col-span-2">
            <label className="label">Booking page URL</label>
            <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5">
              <span className="text-ink-400">{location.origin}/book/</span>
              <input
                className="flex-1 outline-none"
                value={form.slug || ''}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              />
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button onClick={save} className="btn-accent">Save</button>
          {saved && <span className="text-sm text-moss-deep">Saved.</span>}
          {error && <span className="text-sm text-rose-700">{error}</span>}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-display text-2xl text-ink-800">Business hours</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Open at</label>
            <select className="input" value={form.hours?.start ?? 7} onChange={(e) => setForm({ ...form, hours: { ...form.hours, start: +e.target.value } })}>
              {Array.from({ length: 12 }, (_, i) => i + 5).map((h) => <option key={h} value={h}>{h}:00</option>)}
            </select>
          </div>
          <div>
            <label className="label">Close at</label>
            <select className="input" value={form.hours?.end ?? 18} onChange={(e) => setForm({ ...form, hours: { ...form.hours, end: +e.target.value } })}>
              {Array.from({ length: 12 }, (_, i) => i + 12).map((h) => <option key={h} value={h}>{h}:00</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-display text-2xl text-ink-800">Data</h2>
        <p className="mt-1 text-sm text-ink-500">
          {supabaseReady ? 'Connected to Supabase.' : 'Supabase not configured. Set env vars and redeploy.'}
        </p>
      </section>
    </div>
  )
}
