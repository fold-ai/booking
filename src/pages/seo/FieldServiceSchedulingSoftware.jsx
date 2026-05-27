import SeoLanding from '../../components/SeoLanding.jsx'

export default function FieldServiceSchedulingSoftware() {
  return (
    <SeoLanding
      seo={{
        title: 'Field Service Scheduling Software for Small Crews | Drevito',
        description:
          'Drevito is simple field service scheduling software for small crews — drag-and-drop calendar, online booking page, client history, and an AI dispatcher. Free 14-day trial.',
        path: '/field-service-scheduling-software',
      }}
      eyebrow="Field service scheduling software"
      h1="Field service scheduling software built for small crews"
      lede="Stop running your day out of a notebook and group texts. Drevito keeps every job, every crew member, and every customer on one shared calendar — and gives your customers a booking page they can use themselves."
      bullets={[
        'Shared drag-and-drop calendar',
        'Online booking page for customers',
        'Client history, notes & gate codes',
        'AI dispatcher suggests the best slot',
      ]}
      sections={[
        {
          h2: 'Everything a field service business needs to stay booked',
          paragraphs: [
            'Most scheduling tools are built for big operations with dispatchers and back offices. Drevito is built for the two-to-ten-person crew that does the actual work. You see today’s jobs the moment you open the app, assign them to crew with a tap, and reorder stops so nobody zig-zags across town.',
            'Because your services, durations, and prices are set up once, every new booking is accurate from the start. When a customer books online, the right amount of time is blocked on the right day automatically — no double-booking, no guesswork.',
          ],
          list: [
            'Week and day calendar views, color-coded by crew member',
            'Per-service durations, prices, and buffer time',
            'Customer self-booking with confirmation',
            'Tips and custom quotes per job',
          ],
        },
        {
          h2: 'Made for lawn care, window cleaning, pool service & cleaning',
          paragraphs: [
            'Drevito ships with templates for the most common field service trades, so you can be scheduling jobs the same afternoon you sign up. Lawn care companies use it to manage weekly mowing routes; window cleaners use it to take online bookings; pool techs and house cleaners use it to keep recurring clients on schedule.',
            'Your crew gets a focused mobile view of just their jobs — addresses, directions, and notes — while owners and managers see the full picture, including revenue and tips. Sensitive numbers stay with the people who should see them.',
          ],
        },
      ]}
      faqs={[
        {
          q: 'Is Drevito good for a small crew of 2–5 people?',
          a: 'Yes — it’s designed for exactly that size. There’s no complex dispatcher setup. Add your crew, set your services, and you can schedule your first job in minutes.',
        },
        {
          q: 'Can customers book online themselves?',
          a: 'Every business gets a public booking page where customers pick a service and an open time slot. Bookings drop straight onto your calendar.',
        },
        {
          q: 'How much does it cost?',
          a: 'Drevito is $49/month with unlimited workers and bookings, and a free 14-day trial with no credit card required.',
        },
      ]}
    />
  )
}
