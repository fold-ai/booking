import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, ClipboardList, Users, UserCircle2, Wrench, Settings as Cog, Sparkles, Megaphone } from 'lucide-react'
import { useBusiness } from '../context/BusinessContext.jsx'
import BrandMark from './BrandMark.jsx'

const items = [
  { to: '/app',          label: 'Today',          icon: LayoutDashboard, end: true },
  { to: '/app/calendar', label: 'Calendar',       icon: Calendar },
  { to: '/app/bookings', label: 'Bookings',       icon: ClipboardList },
  { to: '/app/clients',  label: 'Clients',        icon: Users },
  { to: '/app/workers',  label: 'Workers',        icon: UserCircle2 },
  { to: '/app/services', label: 'Services',       icon: Wrench },
  { to: '/app/profile',  label: 'Public profile', icon: Megaphone },
  { to: '/app/settings', label: 'Settings',       icon: Cog },
]

export default function Sidebar() {
  const { business } = useBusiness()
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-ink-800 text-ink-100 md:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <BrandMark size={36} variant="light" />
        <div>
          <div className="text-sm font-semibold text-ink-50">Drevito</div>
          <div className="truncate text-xs text-ink-300">{business.name}</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-ink-700 text-ink-50' : 'text-ink-300 hover:bg-ink-700/60 hover:text-ink-50',
              ].join(' ')
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-5">
        <a
          href={`/book/${business.slug}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-700/40 px-3 py-3 text-xs text-ink-200 transition hover:bg-ink-700"
        >
          <Sparkles size={16} className="text-amber" />
          <div className="flex-1">
            <div className="font-medium text-ink-50">Your booking page</div>
            <div className="truncate text-[11px] text-ink-300">/book/{business.slug}</div>
          </div>
        </a>
      </div>
    </aside>
  )
}
