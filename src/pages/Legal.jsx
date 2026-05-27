import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark.jsx'
import Seo from '../components/Seo.jsx'

const CONTACT_EMAIL = 'hello@drevito.com'

function LegalShell({ title, description, path, updated, contactEmail = CONTACT_EMAIL, children }) {
  return (
    <div className="min-h-screen bg-ink-50">
      <Seo title={`${title} | Drevito`} description={description} path={path} />
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
        <Link to="/" className="flex items-center gap-2">
          <BrandMark size={32} variant="dark" />
          <span className="font-display text-lg text-ink-800 sm:text-xl">Drevito</span>
        </Link>
        <Link to="/" className="text-sm text-ink-500 hover:text-ink-800">← Home</Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6">
        <h1 className="font-display text-4xl text-ink-800 sm:text-5xl">{title}</h1>
        <p className="mt-2 text-sm text-ink-400">Last updated: {updated}</p>
        <div className="mt-8 space-y-6 leading-relaxed text-ink-600">{children}</div>
        <p className="mt-12 text-sm text-ink-400">
          Questions? Email <a href={`mailto:${contactEmail}`} className="font-medium text-ink-700 underline">{contactEmail}</a>.
        </p>
      </main>
    </div>
  )
}

function H2({ children }) {
  return <h2 className="font-display text-2xl text-ink-800">{children}</h2>
}

export function Privacy() {
  return (
    <LegalShell
      title="Privacy Policy"
      description="How Drevito collects, uses, and protects your personal data."
      path="/privacy"
      updated="May 26, 2026"
      contactEmail="info@crited.com"
    >
      <p>This Privacy Policy explains how Drevito ("we", "us") collects, uses, and protects your information when you use our app and website (the "Service"). We keep this simple: we only collect what we need to run the Service, and we never sell your data.</p>
      <section className="space-y-2"><H2>What data we collect</H2>
        <p>We collect the following information:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Name</strong> — to set up and identify your account.</li>
          <li><strong>Email</strong> — to create your account, sign you in, and contact you about the Service.</li>
          <li><strong>Location</strong> — job site addresses and, with your permission, your device location to help you navigate to jobs.</li>
        </ul>
      </section>
      <section className="space-y-2"><H2>How we use it</H2>
        <p>We use your information only to provide the Service:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Creating and securing your account.</li>
          <li>Scheduling jobs and displaying your bookings.</li>
          <li>Providing directions and navigation to job sites.</li>
        </ul>
        <p>We do not use your data for advertising, and we do not sell your personal data.</p>
      </section>
      <section className="space-y-2"><H2>Who we share it with</H2>
        <p>We do not share your personal data with any third parties for their own use. We use Supabase as our infrastructure provider to securely store data and authenticate accounts on our behalf. That's the only place your data goes outside the app.</p>
      </section>
      <section className="space-y-2"><H2>Deleting your account and data</H2>
        <p>You can delete your account and all associated data at any time. To request deletion, email us at <a href="mailto:info@crited.com" className="font-medium text-ink-700 underline">info@crited.com</a> from the address on your account, and we will permanently remove your data. You can also edit or delete most of your information directly within the app.</p>
      </section>
      <section className="space-y-2"><H2>Contact us</H2>
        <p>If you have any questions about this Privacy Policy or your data, email us at <a href="mailto:info@crited.com" className="font-medium text-ink-700 underline">info@crited.com</a>.</p>
      </section>
      <section className="space-y-2"><H2>Changes</H2>
        <p>We may update this policy from time to time. Any material changes will be reflected by the "Last updated" date above.</p>
      </section>
    </LegalShell>
  )
}

export function Terms() {
  return (
    <LegalShell
      title="Terms of Service"
      description="The terms governing your use of Drevito's field service scheduling and booking software."
      path="/terms"
      updated="May 24, 2026"
    >
      <p>These Terms govern your use of Drevito (the "Service"). By creating an account you agree to them. This is a general template — review it with legal counsel before relying on it.</p>
      <section className="space-y-2"><H2>Your account</H2>
        <p>You're responsible for the accuracy of the information you enter, for activity under your account, and for keeping your login secure. You must be authorized to manage the business you register.</p>
      </section>
      <section className="space-y-2"><H2>Acceptable use</H2>
        <p>Don't use the Service to break the law, infringe others' rights, send spam, or attempt to disrupt or reverse-engineer the platform. You're responsible for the bookings, pricing, and services you publish.</p>
      </section>
      <section className="space-y-2"><H2>Billing</H2>
        <p>Paid plans are billed in advance on a recurring basis. Free trials convert to paid unless cancelled before the trial ends. Fees are non-refundable except where required by law.</p>
      </section>
      <section className="space-y-2"><H2>Availability & liability</H2>
        <p>The Service is provided "as is." We work to keep it available and accurate but don't guarantee uninterrupted service, and to the extent permitted by law we aren't liable for indirect or consequential damages arising from its use.</p>
      </section>
      <section className="space-y-2"><H2>Termination</H2>
        <p>You may cancel anytime. We may suspend accounts that violate these Terms. On termination you may export or request deletion of your data.</p>
      </section>
    </LegalShell>
  )
}
