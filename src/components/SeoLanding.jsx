import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import BrandMark from './BrandMark.jsx'
import Seo, { softwareSchema, breadcrumb } from './Seo.jsx'

/**
 * Reusable marketing/SEO landing layout. Each keyword page passes unique
 * content (h1, lede, sections, faqs) so pages are not thin or duplicated.
 * Styling: forest-green palette, amber CTA, font-display headings.
 */
export default function SeoLanding({
  seo,            // { title, description, path }
  eyebrow,
  h1,
  lede,
  bullets = [],
  sections = [],  // [{ h2, paragraphs: [], list: [] }]
  faqs = [],
}) {
  const faqSchema = faqs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null

  const jsonLd = [
    softwareSchema({ description: seo.description, url: `https://drevito.com${seo.path}` }),
    breadcrumb([
      { name: 'Home', path: '/' },
      { name: h1, path: seo.path },
    ]),
    ...(faqSchema ? [faqSchema] : []),
  ]

  return (
    <div className="min-h-screen bg-ink-50">
      <Seo title={seo.title} description={seo.description} path={seo.path} jsonLd={jsonLd} />

      <header className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-4 sm:px-6 sm:py-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <BrandMark size={32} variant="dark" />
          <span className="font-display text-lg text-ink-800 sm:text-xl">Drevito</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/discover" className="hidden rounded-full px-4 py-1.5 text-ink-500 hover:text-ink-800 sm:inline">Find a pro</Link>
          <Link to="/login" className="rounded-full px-4 py-1.5 text-ink-500 hover:text-ink-800">Sign in</Link>
          <Link to="/signup" className="btn-accent !px-4 !py-2 !text-sm">Start free <ArrowRight size={14} /></Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        {/* Hero */}
        <section className="grain relative pt-6 sm:pt-12">
          {eyebrow && (
            <div className="chip mb-4"><span className="text-amber-deep">●</span> {eyebrow}</div>
          )}
          <h1 className="font-display text-4xl leading-[1.07] tracking-tight text-ink-800 sm:text-6xl">{h1}</h1>
          <p className="mt-5 text-lg text-ink-500">{lede}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/signup" className="btn-accent">Start free <ArrowRight size={16} /></Link>
            <Link to="/discover" className="btn-ghost">Browse local pros</Link>
          </div>
          {bullets.length > 0 && (
            <ul className="mt-8 grid gap-2 sm:grid-cols-2">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-ink-600">
                  <Check size={16} className="mt-0.5 shrink-0 text-amber-deep" /> {b}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Body sections */}
        {sections.map((s) => (
          <section key={s.h2} className="mt-12">
            <h2 className="font-display text-2xl text-ink-800 sm:text-3xl">{s.h2}</h2>
            {(s.paragraphs || []).map((p, i) => (
              <p key={i} className="mt-3 leading-relaxed text-ink-600">{p}</p>
            ))}
            {s.list && (
              <ul className="mt-4 space-y-2">
                {s.list.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-ink-600">
                    <Check size={16} className="mt-1 shrink-0 text-amber-deep" /> {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* FAQ */}
        {faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl text-ink-800 sm:text-3xl">Frequently asked questions</h2>
            <div className="mt-4 divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-white">
              {faqs.map((f) => (
                <div key={f.q} className="p-5">
                  <h3 className="font-medium text-ink-800">{f.q}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-14 rounded-3xl bg-ink-800 px-6 py-10 text-center text-ink-50">
          <h2 className="font-display text-3xl text-ink-50">Start scheduling in minutes</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-300">
            Free 14-day trial. No credit card. Set up your services and share your booking link the same day.
          </p>
          <Link to="/signup" className="btn-accent mt-6">Create your free account <ArrowRight size={16} /></Link>
        </section>
      </main>

      <footer className="border-t border-ink-100 bg-white py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 text-sm text-ink-400 sm:px-6">
          <div>© {new Date().getFullYear()} Drevito</div>
          <nav className="flex flex-wrap gap-4">
            <Link to="/field-service-scheduling-software" className="hover:text-ink-700">Scheduling software</Link>
            <Link to="/booking-software-for-small-crews" className="hover:text-ink-700">For small crews</Link>
            <Link to="/scheduling-app-for-field-service-teams" className="hover:text-ink-700">For teams</Link>
            <Link to="/discover" className="hover:text-ink-700">Find a pro</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
