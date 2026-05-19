import { useState } from 'react'
import CalendarGrid from '../components/CalendarGrid.jsx'
import BookingDetailModal from '../components/BookingDetailModal.jsx'

export default function Calendar() {
  const [selected, setSelected] = useState(null)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-ink-800">Calendar</h1>
        <p className="mt-1 text-ink-500">Shared schedule across every crew. Click a job to edit.</p>
      </div>
      <CalendarGrid onSelectBooking={setSelected} />
      {selected && <BookingDetailModal booking={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
