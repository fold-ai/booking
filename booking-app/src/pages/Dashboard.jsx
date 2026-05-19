import { useMemo, useState } from 'react'
import { isToday, isThisWeek, parseISO, startOfDay } from 'date-fns'
import { ArrowUpRight, Briefcase, DollarSign, Map, Sparkles, TrendingUp } from 'lucide-react'
import { useBusiness } from '../context/BusinessContext.jsx'
import { suggestRoute } from '../lib/routing.js'
import BookingCard from '../components/BookingCard.jsx'
import BookingDetailModal from '../components/BookingDetailModal.jsx'
import { fmtDayLabel, fmtMoney } from '../lib/format.js'

export default function Dashboard() {
  const { bookings, clients, workers } = useBusiness()
  const [selected, setSelected] = useState(null)

  const today = useMemo(
    () => suggestRoute(bookings.filter((b) => isToday(parseISO(b.start)))),
    [bookings]
  )
  const week = useMemo(
    () => bookings.filter((b) => isThisWeek(parseISO(b.start), { weekStartsOn: 1 })),
    [bookings]
  )
  const revenue = week.reduce((acc, b) => acc + (b.price || 0), 0)
  const activeClients = new Set(week.map((b) => b.clientId)).size

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-400">{fmtDayLabel(startOfDay(new Date()).toISOString())}</div>
          <h1 className="font-display text-5xl text-ink-800">Good morning.</h1>
          <p className="mt-1 text-ink-500">Here's the shape of today.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Briefcase} label="Jobs today"      value={today.length} />
        <Stat icon={TrendingUp} label="Jobs this week" value={week.length} />
        <Stat icon={DollarSign} label="Booked revenue" value={fmtMoney(revenue)} />
        <Stat icon={Map}        label="Active clients" value={activeClients} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl text-ink-800">Today's route</h2>
            {today.length > 0 && (
              <span className="chip"><Sparkles size={12} className="text-amber-deep" /> AI-ordered</span>
            )}
          </div>
          {today.length === 0 ? (
            <div className="card p-8 text-center text-ink-400">No jobs scheduled today.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {today.map((b) => (
                <BookingCard key={b.id} booking={b} onClick={() => setSelected(b)} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="mb-3 font-display text-2xl text-ink-800">Crew today</h2>
            <div className="card divide-y divide-ink-100">
              {workers.map((w) => {
                const jobs = today.filter((b) => b.workerIds?.includes(w.id)).length
                return (
                  <div key={w.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: w.color }} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-ink-700">{w.name}</div>
                      <div className="text-xs text-ink-400">{w.role}</div>
                    </div>
                    <span className="text-sm font-semibold text-ink-700">{jobs}<span className="ml-1 text-xs text-ink-400">jobs</span></span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-ink-800 p-5 text-ink-50">
            <div className="flex items-center gap-2 text-amber">
              <Sparkles size={16} /> <span className="text-xs uppercase tracking-wider">AI ops note</span>
            </div>
            <p className="mt-2 text-sm text-ink-200">
              {today.length === 0
                ? 'Tomorrow looks tight — consider opening a slot for same-day overflow.'
                : `Routing ${today.length} stops by proximity. ${activeClients > 0 ? 'Send the day-of-service text 30 minutes before each visit.' : ''}`}
            </p>
            <a href="/app/calendar" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber hover:underline">
              Open calendar <ArrowUpRight size={14} />
            </a>
          </div>
        </section>
      </div>

      {selected && <BookingDetailModal booking={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-ink-100 text-ink-600">
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-ink-400">{label}</div>
        <div className="font-display text-3xl text-ink-800">{value}</div>
      </div>
    </div>
  )
}
