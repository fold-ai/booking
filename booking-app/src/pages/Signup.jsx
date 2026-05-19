import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useBusiness } from '../context/BusinessContext.jsx'
import { BUSINESS_TYPES } from '../data/businessTypes.js'
import { AuthShell } from './Login.jsx'

export default function Signup() {
  const { signUp, supabaseReady } = useAuth()
  const { createBusinessForUser } = useBusiness()
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '', businessType: 'landscaping' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setInfo(''); setBusy(true)
    try {
      const user = await signUp(form.email, form.password, form.name)
      if (!user) {
        setInfo('Check your inbox to confirm your email, then sign in.')
        return
      }
      try {
        await createBusinessForUser({ name: form.businessName, type: form.businessType })
      } catch (e) {
        // If email confirmation is on, the session may not exist yet — that's OK,
        // the user will create the business after first login via /app setup.
        console.warn('Business not created yet:', e?.message)
      }
      nav('/app')
    } catch (err) {
      setError(err.message || 'Sign up failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Create your workspace" subtitle="Two minutes. We'll preload services for your trade.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Your name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Business name</label>
            <input className="input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Evergreen Outdoor Co." required />
          </div>
          <div>
            <label className="label">Industry</label>
            <select className="input" value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })}>
              {BUSINESS_TYPES.map((b) => <option key={b.id} value={b.id}>{b.emoji} {b.label}</option>)}
            </select>
          </div>
        </div>
        {error && <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
        {info && <div className="rounded-xl bg-moss-soft px-3 py-2 text-sm text-moss-deep">{info}</div>}
        <button disabled={busy} className="btn-accent w-full">{busy ? 'Creating…' : 'Create workspace'}</button>
        {!supabaseReady && (
          <p className="rounded-xl bg-amber-soft px-3 py-2 text-center text-xs text-amber-deep">
            Supabase isn't configured. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment, then redeploy.
          </p>
        )}
        <p className="pt-2 text-center text-sm text-ink-500">
          Already have one? <Link to="/login" className="font-medium text-ink-800 hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  )
}
