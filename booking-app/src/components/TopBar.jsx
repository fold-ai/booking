import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LogOut, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useBusiness } from '../context/BusinessContext.jsx'
import { initials } from '../lib/format.js'
import NewBookingModal from './NewBookingModal.jsx'

export default function TopBar() {
  const { user, signOut } = useAuth()
  const { business } = useBusiness()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <header className="flex items-center gap-3 border-b border-ink-100 bg-ink-50/80 px-6 py-3 backdrop-blur sm:px-10">
      <div className="hidden flex-1 md:block">
        <div className="text-xs uppercase tracking-wider text-ink-400">Field Ops</div>
        <div className="font-display text-2xl leading-tight text-ink-800">{business.name}</div>
      </div>
      <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
        <a href={`/book/${business.slug}`} target="_blank" rel="noreferrer" className="btn-ghost hidden sm:inline-flex">
          <ExternalLink size={16} /> Booking page
        </a>
        <button className="btn-accent" onClick={() => setOpen(true)}>
          <Plus size={16} /> New booking
        </button>
        <div className="ml-2 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-ink-800 text-sm font-semibold text-amber">
            {initials(user?.displayName || user?.email || 'U')}
          </div>
          <button
            onClick={async () => { await signOut(); nav('/') }}
            className="rounded-full p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
      {open && <NewBookingModal onClose={() => setOpen(false)} />}
    </header>
  )
}
