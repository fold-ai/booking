import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useBusiness } from '../context/BusinessContext.jsx'
import { BUSINESS_TYPES } from '../data/businessTypes.js'
import { AuthShell } from './Login.jsx'
import GoogleSignInButton from '../components/GoogleSignInButton.jsx'

/**
 * Простий signup — одна форма, мінімум полів.
 * Деталі (hours, city, phone) користувач допише пізніше в Settings.
 *
 * Чому так: 3-step wizard плутав onboarding і spawn-ив race conditions.
 * Краще проста надійна форма + друга стадія в Settings з banner "Complete profile".
 */
export default function Signup() {
  const { signUp, supabaseReady } = useAuth()
  const { createBusinessForUser } = useBusiness()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    businessType: 'landscaping',
  })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setError(''); setInfo(''); setBusy(true)
    try {
      const user = await signUp(form.email, form.password, form.name)
      if (!user) {
        setInfo('Check your inbox to confirm your email, then sign in to finish setup.')
        setBusy(false)
        return
      }
      await createBusinessForUser({
        name: form.businessName,
        type: form.businessType,
      })
      // Hard reload щоб BusinessContext чисто переініціалізувався
      window.location.href = '/app'
    } catch (err) {
      setError(err.message || 'Sign up failed.')
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Create your workspace" subtitle="Start scheduling in 60 seconds.">
      <form onSubmit={submit} className="space-y-4">
        <GoogleSignInButton label="Continue with Google" disabled={busy} />
        <p className="rounded-xl bg-amber-soft/40 px-3 py-2 text-xs text-ink-600">
          With Google, you'll be asked for business details on the next screen.
        </p>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-ink-100" />
          <span className="mx-3 text-xs uppercase tracking-widest text-ink-400">or with email</span>
          <div className="flex-grow border-t border-ink-100" />
        </div>

        <div>
          <label className="label">Your name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jamie Smith"
            required
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@yourbusiness.com"
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={6}
            required
          />
          <p className="mt-1 text-xs text-ink-400">At least 6 characters.</p>
        </div>

        <div className="border-t border-ink-100 pt-4">
          <p className="mb-3 text-xs uppercase tracking-widest text-ink-400">Your business</p>
          <div className="space-y-3">
            <div>
              <label className="label">Business name</label>
              <input
                className="input"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="Evergreen Outdoor Co."
                required
              />
            </div>
            <div>
              <label className="label">Industry</label>
              <select
                className="input"
                value={form.businessType}
                onChange={(e) => setForm({ ...form, businessType: e.target.value })}
              >
                {BUSINESS_TYPES.map((b) => <option key={b.id} value={b.id}>{b.emoji} {b.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
        {info && <div className="rounded-xl bg-moss-soft px-3 py-2 text-sm text-moss-deep">{info}</div>}

        <button disabled={busy || !supabaseReady} className="btn-accent w-full">
          {busy ? 'Creating workspace…' : 'Create workspace'}
        </button>

        {!supabaseReady && (
          <p className="rounded-xl bg-amber-soft px-3 py-2 text-center text-xs text-amber-deep">
            Supabase isn't configured. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment, then redeploy.
          </p>
        )}

        <p className="pt-2 text-center text-sm text-ink-500">
          Already have a workspace? <Link to="/login" className="font-medium text-ink-800 hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  )
}
