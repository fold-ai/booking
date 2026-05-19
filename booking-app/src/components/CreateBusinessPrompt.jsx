import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useBusiness } from '../context/BusinessContext.jsx'
import { supabase } from '../supabase.js'
import { BUSINESS_TYPES } from '../data/businessTypes.js'
import BrandMark from './BrandMark.jsx'

/**
 * Сторінка показується юзеру що залогінений але не має бізнесу.
 * Три сценарії:
 *   1. У БД насправді є бізнес — refresh пропустив, треба ще раз → одразу redirect
 *   2. Він був запрошений (є pending invitation) → показуємо invitation
 *   3. Він новий і хоче створити свій бізнес → button "Set up my business"
 */
export default function CreateBusinessPrompt() {
  const { user, signOut } = useAuth()
  const { createBusinessForUser, refresh } = useBusiness()
  const nav = useNavigate()
  const [invitations, setInvitations] = useState([])
  const [loadingInv, setLoadingInv] = useState(true)
  const [accepting, setAccepting] = useState(null)
  const [showQuickCreate, setShowQuickCreate] = useState(false)

  // Подвійна перевірка — може у БД вже є бізнес, refresh просто пропустив
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    ;(async () => {
      const { data: ownedBiz } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()
      if (cancelled) return
      if (ownedBiz) {
        // Існує — refresh і одразу на /app
        await refresh()
        nav('/app', { replace: true })
        return
      }
      // Або шукаю чи я worker десь
      const { data: myWorker } = await supabase
        .from('workers')
        .select('business_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (cancelled) return
      if (myWorker?.business_id) {
        await refresh()
        nav('/app', { replace: true })
      }
    })()
    return () => { cancelled = true }
  }, [user?.id])

  // Check for pending invitations
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.rpc('my_pending_invitations')
      if (!cancelled) {
        if (!error) setInvitations(data || [])
        setLoadingInv(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const acceptInvitation = async (inv) => {
    setAccepting(inv.id)
    const { data, error } = await supabase.rpc('accept_invitation', { invitation_token: inv.token })
    if (error || !data?.success) {
      alert(error?.message || data?.error || 'Could not accept.')
      setAccepting(null)
      return
    }
    // Forced reload — щоб BusinessContext refresh підтянув новий бізнес
    window.location.href = '/app'
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
        <Link to="/" className="flex items-center gap-2">
          <BrandMark size={32} variant="dark" />
          <span className="font-display text-lg text-ink-800 sm:text-xl">Drevito</span>
        </Link>
        <button onClick={async () => { await signOut(); nav('/login') }} className="text-sm text-ink-500 hover:text-ink-800">
          Sign out
        </button>
      </header>

      <main className="mx-auto max-w-md px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <h1 className="font-display text-4xl text-ink-800">Hi, {user?.email?.split('@')[0]}.</h1>
        <p className="mt-1 text-ink-500">Let's get you connected to a workspace.</p>

        {/* Pending invitations block */}
        {!loadingInv && invitations.length > 0 && (
          <section className="mt-8 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-deep">
              <Sparkles size={14} /> You have invitations
            </div>
            {invitations.map((inv) => (
              <div key={inv.id} className="card p-5">
                <div className="font-display text-xl text-ink-800">{inv.business_name}</div>
                <div className="mt-1 text-sm text-ink-500">
                  invites you to join as {inv.is_manager ? <strong>manager</strong> : <strong>{inv.role || 'crew'}</strong>}
                </div>
                <button
                  onClick={() => acceptInvitation(inv)}
                  disabled={accepting === inv.id}
                  className="btn-accent mt-4 w-full"
                >
                  {accepting === inv.id ? 'Joining…' : <>Accept and join <ArrowRight size={16} /></>}
                </button>
              </div>
            ))}
            <div className="my-6 flex items-center">
              <div className="flex-grow border-t border-ink-100" />
              <span className="mx-3 text-xs uppercase tracking-widest text-ink-400">or</span>
              <div className="flex-grow border-t border-ink-100" />
            </div>
          </section>
        )}

        {loadingInv && (
          <div className="card mt-8 p-7 text-center text-ink-400">Checking for invitations…</div>
        )}

        {/* Create your own business */}
        {!loadingInv && !showQuickCreate && (
          <section className="card mt-4 p-7 text-center">
            <h2 className="font-display text-2xl text-ink-800">Start your own workspace</h2>
            <p className="mt-1 text-sm text-ink-500">
              Have your own service business? Set up your workspace in 60 seconds.
            </p>
            <button onClick={() => setShowQuickCreate(true)} className="btn-accent mt-5 w-full">
              Set up my business <ArrowRight size={16} />
            </button>
            <p className="mt-3 text-xs text-ink-400">
              No business of your own? Ask your manager to send you an invitation link.
            </p>
          </section>
        )}

        {showQuickCreate && (
          <QuickCreate
            onCancel={() => setShowQuickCreate(false)}
            onCreate={createBusinessForUser}
            onSuccess={() => nav('/app')}
          />
        )}
      </main>
    </div>
  )
}

function QuickCreate({ onCancel, onCreate, onSuccess }) {
  const [form, setForm] = useState({ businessName: '', businessType: 'landscaping', city: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await onCreate({
        name: form.businessName,
        type: form.businessType,
        city: form.city,
      })
      onSuccess()
    } catch (err) {
      setError(err.message || 'Could not create workspace.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card mt-4 space-y-4 p-7">
      <h2 className="font-display text-2xl text-ink-800">Your business</h2>
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
      <div>
        <label className="label">City</label>
        <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Chicago, IL" />
      </div>
      {error && <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <div className="flex items-center gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Back</button>
        <button disabled={busy || !form.businessName} className="btn-accent flex-1">
          {busy ? 'Creating…' : 'Create workspace'}
        </button>
      </div>
    </form>
  )
}
