import SeoLanding from '../../components/SeoLanding.jsx'

export default function BookingSoftwareForSmallCrews() {
  return (
    <SeoLanding
      seo={{
        title: 'Booking Software for Small Crews — Online Booking Page | Drevito',
        description:
          'Give your small crew a professional online booking page. Customers book themselves, you approve, and the job lands on your shared calendar. Free 14-day trial, no card.',
        path: '/booking-software-for-small-crews',
      }}
      eyebrow="Online booking for small crews"
      h1="Booking software that lets your customers book your crew online"
      lede="Phone tag loses jobs. With Drevito, customers visit your booking page, pick a service and a time that’s actually open, and you get a clean booking — no back-and-forth, no missed calls after hours."
      bullets={[
        'Your own /book link to share anywhere',
        'Only shows times you’re actually free',
        'Works on any phone, no app needed',
        'New customers saved to your client list',
      ]}
      sections={[
        {
          h2: 'A booking page that works while you’re on the job',
          paragraphs: [
            'When you’re up a ladder or behind a mower, you can’t answer the phone — and that’s exactly when new customers are trying to reach you. Drevito gives your crew a shareable booking link you can put on Google, Instagram, your truck, or a yard sign. Customers book around your real availability, day or night.',
            'Each booking captures the customer’s name, phone, address, and the service they want, then creates a client record automatically. The next time they book, everything’s already on file — including notes like gate codes, dog warnings, or “park in the alley.”',
          ],
          list: [
            'Share one link across Google, social, and flyers',
            'Customers only see open, valid time slots',
            'Automatic client records with full history',
            'An AI chat assistant can take the booking in plain English',
          ],
        },
        {
          h2: 'Built for the realities of a small team',
          paragraphs: [
            'You don’t need enterprise dispatch software to look professional. Drevito keeps setup light: add your services and prices, set your working hours, and your booking page is live. As bookings come in, they appear on a shared calendar your whole crew can see.',
            'Owners stay in control of money — prices, tips, and weekly earnings are visible only to owners and managers, while crew members see just the jobs and addresses they need for the day.',
          ],
        },
      ]}
      faqs={[
        {
          q: 'Do my customers need to download an app to book?',
          a: 'No. Your booking page opens in any web browser on phone or desktop. They just tap your link, pick a service, and choose a time.',
        },
        {
          q: 'Will it stop double-bookings?',
          a: 'Yes. The page only offers time slots that fit your working hours and aren’t already taken, so two customers can’t grab the same window.',
        },
        {
          q: 'Can I still add bookings manually?',
          a: 'Absolutely. You can create and edit bookings yourself from the dashboard or the mobile app at any time.',
        },
      ]}
    />
  )
}
