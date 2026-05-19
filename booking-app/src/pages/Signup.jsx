import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useBusiness } from '../context/BusinessContext.jsx'
import { BUSINESS_TYPES } from '../data/businessTypes.js'
import { AuthShell } from './Login.jsx'
import GoogleSignInButton from '../components/GoogleSignInButton.jsx'

/**
 * Signup wizard — 3 кроки замість однієї форми.
 *
 * Step 1: Account (email + password)
 * Step 2: About your business (name, industry, city, size, years)
 * Step 3: Hours and you're done
 *
 * Це робить онбординг "серйознішим" — користувачі що не готові вкладатися
 * відсіюються природним чином.
 */
export default function Signup() {
  const { signUp, supabaseReady } = useAuth()
  const { createBusinessForUser } = useBusiness()
  const nav = useNavigate()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    // Step 1
    name: '', email: '', password: '',
    // Step 2
    businessName: '',
    businessType: 'landscaping',
    city: '',
    crewSize: '1-5',
    yearsInBusiness: '0-1',
    phone: '',
    // Step 3
    schedule: defaultSchedule(),
    slotMinutes: 30,
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState('')

  // ---------- Step navigation ----------
  const next = () => setStep((s) => Math.min(3, s + 1))
  const prev = () => setStep((s) => Math.max(1, s - 1))

  const canNext1 = form.name && form.email && form.password.length >= 6
  const canNext2 = form.businessName && form.businessType && form.city

  // ---------- Final submit ----------
  const submit = async () => {
    setError(''); setInfo(''); setBusy(true)
    try {
      const user = await signUp(form.email, form.password, form.name)
      if (!user) {
        setInfo('Check your inbox to confirm your email, then sign in to finish setup.')
        setBusy(false)
        return
      }
      // Створюємо бізнес — якщо помилка, ПОКАЗУЄМО її користувачу
      await createBusinessForUser({
        name: form.businessName,
        type: form.businessType,
        city: form.city,
        phone: form.phone,
        schedule: form.schedule,
        slotMinutes: form.slotMinutes,
      })
      // Чекаємо невелику паузу щоб BusinessContext refresh точно увідбувся
      await new Promise((r) => setTimeout(r, 600))
      nav('/app')
    } catch (err) {
      setError(err.message || 'Sign up failed.')
      // НЕ скидаємо step — щоб юзер не втратив введені дані
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title={['Welcome to Drevito', 'About your business', 'Working hours'][step - 1]}
      subtitle={['Step 1 of 3', 'Step 2 of 3', 'Step 3 of 3'][step - 1]}
    >
      <div className="space-y-4">
        {/* Step indicator */}
        <StepIndicator current={step} />

        {step === 1 && (
          <>
            <GoogleSignInButton label="Continue with Google" disabled={busy} />
            <div className="rounded-xl bg-amber-soft/40 px-3 py-2 text-xs text-ink-600">
              Signing in with Google skips the password step. You'll still set up your business after.
            </div>
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-ink-100" />
              <span className="mx-3 text-xs uppercase tracking-widest text-ink-400">or with email</span>
              <div className="flex-grow border-t border-ink-100" />
            </div>

            <Field label="Your name">
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jamie Smith"
                autoFocus
              />
            </Field>
            <Field label="Email">
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@yourbusiness.com"
              />
            </Field>
            <Field label="Password" hint="At least 6 characters.">
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>

            <div className="flex justify-end pt-2">
              <button onClick={next} disabled={!canNext1} className="btn-accent">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Business name">
              <input
                className="input"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="Evergreen Outdoor Co."
                autoFocus
              />
            </Field>
            <Field label="Industry">
              <select
                className="input"
                value={form.businessType}
                onChange={(e) => setForm({ ...form, businessType: e.target.value })}
              >
                {BUSINESS_TYPES.map((b) => <option key={b.id} value={b.id}>{b.emoji} {b.label}</option>)}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="City">
                <input
                  className="input"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Chicago, IL"
                />
              </Field>
              <Field label="Phone (optional)">
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </Field>
            </div>
            <Field label="Crew size">
              <div className="grid grid-cols-3 gap-2">
                {['1-5', '5-15', '15+'].map((s) => (
                  <PickButton key={s} active={form.crewSize === s} onClick={() => setForm({ ...form, crewSize: s })}>
                    {s}
                  </PickButton>
                ))}
              </div>
            </Field>
            <Field label="Years in business">
              <div className="grid grid-cols-3 gap-2">
                {['0-1', '1-5', '5+'].map((s) => (
                  <PickButton key={s} active={form.yearsInBusiness === s} onClick={() => setForm({ ...form, yearsInBusiness: s })}>
                    {s}
                  </PickButton>
                ))}
              </div>
            </Field>

            <div className="flex items-center justify-between pt-2">
              <button onClick={prev} className="btn-ghost"><ArrowLeft size={16} /> Back</button>
              <button onClick={next} disabled={!canNext2} className="btn-accent">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="rounded-xl bg-amber-soft/40 px-3 py-3 text-sm text-ink-700">
              Set your working days. Customers can only book inside these hours. You can change everything in Settings later.
            </div>

            <div className="rounded-xl border border-ink-100 divide-y divide-ink-100">
              {DAYS.map(({ key, label }) => {
                const day = form.schedule[key]
                return (
                  <div key={key} className="flex items-center gap-3 px-3 py-2.5">
                    <label className="inline-flex w-24 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={day.enabled}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            schedule: { ...form.schedule, [key]: { ...day, enabled: e.target.checked } },
                          })
                        }
                      />
                      <span className="text-sm font-medium text-ink-700">{label}</span>
                    </label>
                    <div className={`flex flex-1 items-center gap-2 ${day.enabled ? '' : 'opacity-40'}`}>
                      <select
                        className="input !py-1 max-w-[100px]"
                        disabled={!day.enabled}
                        value={day.open}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            schedule: { ...form.schedule, [key]: { ...day, open: +e.target.value } },
                          })
                        }
                      >
                        {Array.from({ length: 24 }, (_, h) => (
                          <option key={h} value={h}>{formatHour(h)}</option>
                        ))}
                      </select>
                      <span className="text-ink-400 text-xs">to</span>
                      <select
                        className="input !py-1 max-w-[100px]"
                        disabled={!day.enabled}
                        value={day.close}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            schedule: { ...form.schedule, [key]: { ...day, close: +e.target.value } },
                          })
                        }
                      >
                        {Array.from({ length: 24 }, (_, h) => (
                          <option key={h} value={h}>{formatHour(h)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>

            {error && <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
            {info && <div className="rounded-xl bg-moss-soft px-3 py-2 text-sm text-moss-deep">{info}</div>}

            <div className="flex items-center justify-between pt-2">
              <button onClick={prev} className="btn-ghost" disabled={busy}><ArrowLeft size={16} /> Back</button>
              <button onClick={submit} disabled={busy} className="btn-accent">
                {busy ? 'Creating workspace…' : <>Create workspace <Check size={16} /></>}
              </button>
            </div>
          </>
        )}

        {!supabaseReady && (
          <p className="rounded-xl bg-amber-soft px-3 py-2 text-center text-xs text-amber-deep">
            Supabase isn't configured. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment, then redeploy.
          </p>
        )}
        <p className="pt-2 text-center text-sm text-ink-500">
          Already have a workspace? <Link to="/login" className="font-medium text-ink-800 hover:underline">Sign in</Link>
        </p>
      </div>
    </AuthShell>
  )
}

// ---------- Components ----------

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 pb-2">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`h-1.5 flex-1 rounded-full transition ${
            s <= current ? 'bg-amber' : 'bg-ink-100'
          }`}
        />
      ))}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}

function PickButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
        active
          ? 'border-amber bg-amber-soft text-ink-800'
          : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
      }`}
    >
      {children}
    </button>
  )
}

// ---------- Helpers ----------

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
]

function defaultSchedule() {
  return {
    mon: { open: 9, close: 17, enabled: true },
    tue: { open: 9, close: 17, enabled: true },
    wed: { open: 9, close: 17, enabled: true },
    thu: { open: 9, close: 17, enabled: true },
    fri: { open: 9, close: 17, enabled: true },
    sat: { open: 9, close: 14, enabled: false },
    sun: { open: 0, close: 0, enabled: false },
  }
}

function formatHour(h) {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}
