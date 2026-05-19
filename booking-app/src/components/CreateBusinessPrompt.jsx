import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useBusiness } from '../context/BusinessContext.jsx'
import { BUSINESS_TYPES } from '../data/businessTypes.js'

// Shown after sign-in if the user has no business row yet.
// Happens when email confirmation was on at signup, so the business
// couldn't be created in that step.
export default function CreateBusinessPrompt() {
  const { signOut } = useAuth()
  const { createBusinessForUser } = useBusiness()
  const nav = useNavigate()
  const [form, setForm] = useState({ businessName: '', businessType: 'landscaping' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await createBusinessForUser({ name: form.businessName, type: form.businessType })
      nav('/app')
    } catch (err) {
      setError(err.message || 'Could not create workspace.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <main className="mx-auto flex max-w-md flex-col px-6 pb-20 pt-16">
        <h1 className="font-display text-4xl text-ink-800">One more step.</h1>
        <p className="mt-1 text-ink-500">Set up your workspace. We'll preload services for your trade.</p>
        <form onSubmit={submit} className="card mt-8 space-y-4 p-7">
          <div>
            <label className="label">Business name</label>
            <input className="input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} required autoFocus />
          </div>
          <div>
            <label className="label">Industry</label>
            <select className="input" value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })}>
              {BUSINESS_TYPES.map((b) => <option key={b.id} value={b.id}>{b.emoji} {b.label}</option>)}
            </select>
          </div>
          {error && <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
          <button disabled={busy || !form.businessName} className="btn-accent w-full">{busy ? 'Creating…' : 'Create workspace'}</button>
          <button type="button" onClick={async () => { await signOut(); nav('/login') }} className="w-full text-center text-sm text-ink-400 hover:underline">
            Sign out
          </button>
        </form>
      </main>
    </div>
  )
}
