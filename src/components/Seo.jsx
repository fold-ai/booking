import { Helmet } from 'react-helmet-async'

export const SITE_URL = 'https://drevito.com'
const DEFAULT_OG = '/og-image.png'

/**
 * Per-page document head: title, description, canonical, Open Graph,
 * Twitter Card, optional JSON-LD structured data, and optional noindex.
 *
 * Usage:
 *   <Seo title="…" description="…" path="/discover" jsonLd={schema} />
 */
export default function Seo({
  title,
  description,
  path = '',
  image = DEFAULT_OG,
  type = 'website',
  noindex = false,
  jsonLd,
}) {
  const url = `${SITE_URL}${path}`
  const img = image.startsWith('http') ? image : `${SITE_URL}${image}`
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content="Drevito" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={img} />

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  )
}

// Shared structured-data builders -------------------------------------------

export const orgSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Drevito',
  url: SITE_URL,
  logo: `${SITE_URL}/og-image.png`,
  sameAs: [],
})

export const softwareSchema = ({
  name = 'Drevito',
  description,
  url = SITE_URL,
} = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS',
  url,
  description,
  offers: {
    '@type': 'Offer',
    price: '49',
    priceCurrency: 'USD',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: '49',
      priceCurrency: 'USD',
      unitText: 'MONTH',
    },
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '27',
  },
})

export const breadcrumb = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: `${SITE_URL}${it.path}`,
  })),
})
