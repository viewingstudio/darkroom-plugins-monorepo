/**
 * Pure function to generate JSON-LD structured data from a Payload document.
 * Zero server dependencies — safe to import on the frontend.
 *
 * @param doc - The document with `meta.structuredData` fields (use your Payload-generated types)
 * @param globalSettings - Optional SEO Settings global data (for address fallback)
 * @returns JSON-LD object or null if minimum required fields are missing
 */
export function generateSchema(
  doc: Record<string, any>,
  globalSettings?: Record<string, any>,
): Record<string, any> | null {
  const sd = doc?.meta?.structuredData
  if (!sd?.schemaType || sd.schemaType === 'none') {
    return null
  }

  const headline = doc?.meta?.title || doc?.title
  if (!headline) {
    return null
  }

  switch (sd.schemaType) {
    case 'article':
      return buildArticle(headline, sd.articleFields, doc)
    case 'product':
      return buildProduct(headline, sd.productFields)
    case 'service':
      return buildService(headline, sd.serviceFields)
    case 'event':
      return buildEvent(headline, sd.eventFields)
    case 'localBusiness':
      return buildLocalBusiness(headline, sd.localBusinessFields, globalSettings)
    default:
      return null
  }
}

function clean(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const cleaned = clean(value)
        if (Object.keys(cleaned).length > 0) {
          result[key] = cleaned
        }
      } else {
        result[key] = value
      }
    }
  }
  return result
}

function buildArticle(
  headline: string,
  fields?: Record<string, any>,
  doc?: Record<string, any>,
): Record<string, any> | null {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description: doc?.meta?.description,
    author: fields?.author
      ? {
          '@type': 'Person',
          name: fields.author,
        }
      : undefined,
    datePublished: fields?.publishDate,
    image: doc?.meta?.image?.url,
  })
}

function buildProduct(
  name: string,
  fields?: Record<string, any>,
): Record<string, any> | null {
  if (!fields?.price) return null

  return clean({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    offers: {
      '@type': 'Offer',
      price: fields.price,
      priceCurrency: fields.currency || 'USD',
      availability: fields.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  })
}

function buildService(
  name: string,
  fields?: Record<string, any>,
): Record<string, any> | null {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    serviceType: fields?.serviceType,
    provider: fields?.provider
      ? {
          '@type': 'Organization',
          name: fields.provider,
        }
      : undefined,
    areaServed: fields?.areaServed,
  })
}

function buildEvent(
  name: string,
  fields?: Record<string, any>,
): Record<string, any> | null {
  if (!fields?.startDate) return null

  return clean({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    startDate: fields.startDate,
    endDate: fields.endDate,
    location: fields.locationName
      ? {
          '@type': 'Place',
          name: fields.locationName,
          address: fields.locationAddress,
        }
      : undefined,
  })
}

function buildLocalBusiness(
  name: string,
  fields?: Record<string, any>,
  globalSettings?: Record<string, any>,
): Record<string, any> | null {
  // Resolve address: use global if `useGlobalAddress` is true
  const addressSource =
    fields?.useGlobalAddress && globalSettings?.knowledgeGraph?.address
      ? globalSettings.knowledgeGraph.address
      : fields?.address

  return clean({
    '@context': 'https://schema.org',
    '@type': fields?.businessType || 'LocalBusiness',
    name,
    priceRange: fields?.priceRange,
    address: addressSource
      ? {
          '@type': 'PostalAddress',
          streetAddress: addressSource.streetAddress,
          addressLocality: addressSource.city,
          addressRegion: addressSource.state,
          postalCode: addressSource.postalCode,
          addressCountry: addressSource.country,
        }
      : undefined,
  })
}
