import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { addDays, addMinutes, format, isSameDay, parseISO, setHours, setMinutes, startOfDay } from 'date-fns'
import { ArrowRight, Bot, CheckCircle2, Send, Sparkles, User } from 'lucide-react'
import { supabase, supabaseReady } from '../supabase.js'
import { fromBusiness, fromService, fromBooking, toClient, toBooking } from '../lib/mappers.js'
import { fmtMoney } from '../lib/format.js'

export default function PublicBooking() {
  const { slug } = useParams()
  const [business, setBusiness] = useState(null)
  const [services, setServices] = useState([])
  const [bookings, setBookings] = useState([])
  const [loadState, setLoadState] = useState('loading') // 'loading' | 'missing' | 'ready' | 'error'
  const [loadError, setLoadError] = useState('')

  const [mode, setMode] = useState('quick')
  const [step, setStep] = useState('service')
  const [picked, setPicked] = useState({ service: null, slot: null, name: '', phone: '', address: '', notes: '' })
  const [done, setDone] = useState(null)
  const [submitErr, setSubmitErr] = useState('')

  useEffect(() => {
    if (!supabaseReady) { setLoadState('error'); setLoadError('Supabase not configured.'); return }
    let cancelled = false
    ;(async () => {
      try {
        const { data: biz, error: be } = await supabase
          .from('businesses').select('*').eq('slug', slug).maybeSingle()
        if (be) throw be
        if (!biz) { if (!cancelled) setLoadState('missing'); return }
        const [svc, bk] = await Promise.all([
          supabase.from('services').select('*').eq('business_id', biz.id).eq('active', true),
          supabase.from('bookings').select('start_at,end_at').eq('business_id', biz.id),
        ])
        if (svc.error) throw svc.error
        if (bk.error) throw bk.error
        if (cancelled) return
        setBusiness(fromBusiness(biz))
        setServices((svc.data || []).map(fromService))
        setBookings((bk.data || []).map((r) => ({ start: r.start_at, end: r.end_at })))
        setLoadState('ready')
      } catch (e) {
        if (cancelled) return
        setLoadState('error'); setLoadError(e.message || String(e))
      }
    })()
    return () => { cancelled = true }
  }, [slug])

  const slots = useMemo(() => {
    if (!picked.service || !business) return []
    const today = startOfDay(new Date())
    const out = []
    for (let d = 1; d <= 7; d++) {
      const day = addDays(today, d)
      for (let h = business.hours.start; h < business.hours.end; h += 1) {
        const t = setMinutes(setHours(day, h), 0)
        const end = addMinutes(t, picked.service.durationMin)
        const collides = bookings.some((b) => {
          const bs = parseISO(b.start); const be = parseISO(b.end)
          return isSameDay(bs, day) && bs < end && be > t
        })
        if (!collides) out.push(t.toISOString())
      }
    }
    return out
  }, [picked.service, bookings, business])

  const confirm = async () => {
    setSubmitErr('')
    try {
      const clientPayload = toClient({
        name: picked.name, phone: picked.phone, address: picked.address,
        email: null, tags: ['booked-online'], notes: null,
      }, business.id)
      const { data: client, error: ce } = await supabase.from('clients').insert(clientPayload).select().single()
      if (ce) throw ce
      const start = new Date(picked.slot)
      const end = addMinutes(start, picked.service.durationMin)
      const bookingPayload = toBooking({
        clientId: client.id,
        serviceId: picked.service.id,
        workerIds: [],
        start: start.toISOString(),
        end: end.toISOString(),
        address: picked.address,
        price: picked.service.basePrice,
        notes: picked.notes,
        status: 'scheduled',
      }, business.id)
      const { data: created, error: be } = await supabase.from('bookings').insert(bookingPayload).select().single()
      if (be) throw be
      setDone(fromBooking(created))
    } catch (e) {
      setSubmitErr(e.message || 'Could not submit booking.')
    }
  }

  if (loadState === 'loading') {
    return <Shell business={{ name: 'Loading…' }}><div className="py-10 text-center text-ink-400">Loading…</div></Shell>
  }
  if (loadState === 'missing') {
    return <Shell business={{ name: 'Not found' }}><div className="text-center text-ink-500">No business at <code>/{slug}</code>.</div></Shell>
  }
  if (loadState === 'error') {
    return <Shell business={{ name: 'Error' }}><div className="text-center text-rose-700">{loadError}</div></Shell>
  }

  if (done) {
    return (
      <Shell business={business}>
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-moss text-white"><CheckCircle2 size={28} /></div>
          <h2 className="mt-4 font-display text-4xl text-ink-800">You're booked.</h2>
          <p className="mt-1 text-ink-500">{picked.service.name} on {format(parseISO(done.start), 'EEEE, MMM d')} at {format(parseISO(done.start), 'h:mm a')}.</p>
          <p className="mt-1 text-sm text-ink-400">We'll text {picked.phone} to confirm.</p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell business={business}>
      <div className="mb-6 flex gap-2">
        <ModeTab active={mode === 'quick'} onClick={() => setMode('quick')} icon={Sparkles}>Quick book</ModeTab>
        <ModeTab active={mode === 'ai'}    onClick={() => setMode('ai')}    icon={Bot}>Chat with AI</ModeTab>
      </div>

      {mode === 'ai' ? (
        <AIChat
          onProposal={(p) => {
            const service = services.find((s) => s.id === p.serviceId) || services[0]
            setPicked((cur) => ({ ...cur, service, slot: p.slotISO || cur.slot, notes: p.notes || cur.notes }))
            setMode('quick')
            setStep(p.slotISO ? 'details' : 'time')
          }}
          services={services}
          slots={slots}
          business={business}
        />
      ) : (
        <>
          {step === 'service' && (
            <div className="space-y-3">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setPicked({ ...picked, service: s }); setStep('time') }}
                  className="card group flex w-full items-center justify-between p-5 text-left transition hover:shadow-pop"
                >
                  <div>
                    <div className="font-display text-2xl text-ink-800">{s.name}</div>
                    <div className="text-sm text-ink-400">{s.durationMin} min</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-display text-2xl text-amber-deep">{fmtMoney(s.basePrice)}</div>
                      <div className="text-xs text-ink-400">starting at</div>
                    </div>
                    <ArrowRight size={18} className="text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-ink-700" />
                  </div>
                </button>
              ))}
              {services.length === 0 && (
                <div className="card p-8 text-center text-ink-400">No services available yet.</div>
              )}
            </div>
          )}

          {step === 'time' && picked.service && (
            <div>
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="font-display text-2xl text-ink-800">Pick a time</h3>
                <button onClick={() => setStep('service')} className="text-sm text-ink-400 hover:underline">← change service</button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {slots.slice(0, 20).map((iso) => {
                  const d = parseISO(iso)
                  return (
                    <button
                      key={iso}
                      onClick={() => { setPicked({ ...picked, slot: iso }); setStep('details') }}
                      className="rounded-xl border border-ink-200 bg-white p-3 text-left transition hover:border-ink-800 hover:shadow-card"
                    >
                      <div className="text-xs uppercase tracking-wider text-ink-400">{format(d, 'EEE, MMM d')}</div>
                      <div className="mt-1 font-display text-xl text-ink-800">{format(d, 'h:mm a')}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 'details' && picked.slot && (
            <div>
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="font-display text-2xl text-ink-800">Your details</h3>
                <button onClick={() => setStep('time')} className="text-sm text-ink-400 hover:underline">← change time</button>
              </div>
              <div className="space-y-3">
                <div><label className="label">Full name</label><input className="input" value={picked.name} onChange={(e) => setPicked({ ...picked, name: e.target.value })} /></div>
                <div><label className="label">Phone</label><input className="input" value={picked.phone} onChange={(e) => setPicked({ ...picked, phone: e.target.value })} /></div>
                <div><label className="label">Address</label><input className="input" value={picked.address} onChange={(e) => setPicked({ ...picked, address: e.target.value })} /></div>
                <div><label className="label">Anything we should know?</label><textarea className="input min-h-[80px]" value={picked.notes} onChange={(e) => setPicked({ ...picked, notes: e.target.value })} /></div>
                {submitErr && <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{submitErr}</div>}
                <button disabled={!picked.name || !picked.phone || !picked.address} onClick={confirm} className="btn-accent w-full">Confirm booking</button>
              </div>
            </div>
          )}
        </>
      )}
    </Shell>
  )
}

function Shell({ business, children }) {
  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-800 text-amber font-bold">{(business?.name || 'F')[0]}</div>
            <div className="min-w-0">
              <div className="truncate font-display text-lg text-ink-800 sm:text-xl">{business?.name}</div>
              <div className="text-xs text-ink-400">{business?.city}</div>
            </div>
          </div>
          <div className="hidden shrink-0 text-xs text-ink-400 sm:block">Powered by Fieldbase</div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  )
}

function ModeTab({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${active ? 'bg-ink-800 text-ink-50' : 'border border-ink-200 bg-white text-ink-600 hover:bg-ink-50'}`}
    >
      <Icon size={14} />
      {children}
    </button>
  )
}

function AIChat({ services, slots, business, onProposal }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi — I'm the ${business?.name || ''} booking assistant. Tell me what you need and roughly when, and I'll find a slot.` },
  ])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const ref = useRef(null)

  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' }) }, [messages, busy])

  const send = async () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setBusy(true)
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          context: {
            business: { name: business.name, type: business.type, city: business.city, hours: business.hours },
            services: services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin, basePrice: s.basePrice })),
            availableSlots: slots.slice(0, 8),
            now: new Date().toISOString(),
          },
        }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
      if (data.proposal) {
        setMessages((m) => [...m, { role: 'system', content: 'proposal', proposal: data.proposal, onProposal }])
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: "I'm having trouble reaching the AI service. You can use Quick book instead." }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card flex h-[520px] flex-col overflow-hidden">
      <div ref={ref} className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.map((m, i) => {
          if (m.role === 'system' && m.proposal) {
            const svc = services.find((s) => s.id === m.proposal.serviceId)
            return (
              <div key={i} className="rounded-2xl border border-amber bg-amber-soft p-4">
                <div className="text-xs uppercase tracking-wider text-amber-deep">AI suggestion</div>
                <div className="mt-1 font-display text-xl text-ink-800">{svc?.name}{m.proposal.slotISO ? ` · ${format(parseISO(m.proposal.slotISO), 'EEE, MMM d · h:mm a')}` : ''}</div>
                {m.proposal.notes && <div className="mt-1 text-sm text-ink-600">{m.proposal.notes}</div>}
                <button className="btn-accent mt-3" onClick={() => onProposal(m.proposal)}>Use this</button>
              </div>
            )
          }
          const isUser = m.role === 'user'
          return (
            <div key={i} className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-800 text-amber"><Bot size={14} /></div>}
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${isUser ? 'bg-ink-800 text-ink-50' : 'bg-ink-100 text-ink-700'}`}>{m.content}</div>
              {isUser && <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-600"><User size={14} /></div>}
            </div>
          )
        })}
        {busy && <div className="text-xs text-ink-400">Thinking…</div>}
      </div>
      <div className="border-t border-ink-100 p-3">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="My lawn is overgrown, about a quarter acre — can you come Friday morning?"
            className="input"
          />
          <button onClick={send} disabled={busy || !draft.trim()} className="btn-accent"><Send size={14} /></button>
        </div>
      </div>
    </div>
  )
}
