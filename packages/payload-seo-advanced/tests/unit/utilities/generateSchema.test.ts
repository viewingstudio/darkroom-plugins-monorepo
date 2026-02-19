import { describe, test, expect } from 'vitest'
import { generateSchema } from '../../../src/utilities/generateSchema.js'

describe('generateSchema', () => {
  describe('Edge Cases and Validation', () => {
    test('returns null when doc is missing structured data', () => {
      const doc = { title: 'Test Page' }
      const result = generateSchema(doc)
      expect(result).toBeNull()
    })

    test('returns null when structuredData is an empty array', () => {
      const doc = {
        title: 'Test Page',
        meta: {
          structuredData: [],
        },
      }
      const result = generateSchema(doc)
      expect(result).toBeNull()
    })

    test('returns null when structuredData block has no blockType', () => {
      const doc = {
        title: 'Test Page',
        meta: {
          structuredData: [{ id: 'abc' }],
        },
      }
      const result = generateSchema(doc)
      expect(result).toBeNull()
    })

    test('returns null when structuredData is not an array', () => {
      const doc = {
        title: 'Test Page',
        meta: {
          structuredData: { blockType: 'article' },
        },
      }
      const result = generateSchema(doc)
      expect(result).toBeNull()
    })

    test('returns null when title is missing', () => {
      const doc = {
        meta: {
          structuredData: [{ blockType: 'article', id: 'abc' }],
        },
      }
      const result = generateSchema(doc)
      expect(result).toBeNull()
    })

    test('returns null when both meta.title and title are missing', () => {
      const doc = {
        meta: {
          structuredData: [{ blockType: 'article', id: 'abc' }],
        },
      }
      const result = generateSchema(doc)
      expect(result).toBeNull()
    })

    test('returns null for unknown block type', () => {
      const doc = {
        title: 'Test Page',
        meta: {
          structuredData: [{ blockType: 'unknown' as any, id: 'abc' }],
        },
      }
      const result = generateSchema(doc)
      expect(result).toBeNull()
    })

    test('uses meta.title over doc.title', () => {
      const doc = {
        title: 'Doc Title',
        meta: {
          title: 'Meta Title',
          structuredData: [{ blockType: 'article', id: 'abc' }],
        },
      }
      const result = generateSchema(doc)
      expect(result?.headline).toBe('Meta Title')
    })

    test('falls back to doc.title when meta.title is missing', () => {
      const doc = {
        title: 'Doc Title',
        meta: {
          structuredData: [{ blockType: 'article', id: 'abc' }],
        },
      }
      const result = generateSchema(doc)
      expect(result?.headline).toBe('Doc Title')
    })
  })

  describe('Article Schema', () => {
    test('generates minimal article schema', () => {
      const doc = {
        title: 'Test Article',
        meta: {
          structuredData: [{ blockType: 'article', id: 'abc' }],
        },
      }
      const result = generateSchema(doc)
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test Article',
      })
    })

    test('generates full article schema with all fields', () => {
      const doc = {
        title: 'Test Article',
        meta: {
          title: 'Meta Title',
          description: 'Test description',
          image: { url: 'https://example.com/image.jpg' },
          structuredData: [
            {
              blockType: 'article',
              id: 'abc',
              author: 'John Doe',
              publishDate: '2023-01-01',
            },
          ],
        },
      }
      const result = generateSchema(doc)
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Meta Title',
        description: 'Test description',
        author: {
          '@type': 'Person',
          name: 'John Doe',
        },
        datePublished: '2023-01-01',
        image: 'https://example.com/image.jpg',
      })
    })

    test('handles article with missing optional fields', () => {
      const doc = {
        title: 'Test Article',
        meta: {
          structuredData: [
            {
              blockType: 'article',
              id: 'abc',
            },
          ],
        },
      }
      const result = generateSchema(doc)
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test Article',
      })
    })
  })

  describe('Product Schema', () => {
    test('generates product schema with required price', () => {
      const doc = {
        title: 'Test Product',
        meta: {
          structuredData: [
            {
              blockType: 'product',
              id: 'abc',
              price: 29.99,
              inStock: true,
            },
          ],
        },
      }
      const result = generateSchema(doc)
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Test Product',
        offers: {
          '@type': 'Offer',
          price: 29.99,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      })
    })

    test('returns null when product price is missing', () => {
      const doc = {
        title: 'Test Product',
        meta: {
          structuredData: [
            {
              blockType: 'product',
              id: 'abc',
            },
          ],
        },
      }
      const result = generateSchema(doc)
      expect(result).toBeNull()
    })

    test('generates product schema with custom currency and stock status', () => {
      const doc = {
        title: 'Test Product',
        meta: {
          structuredData: [
            {
              blockType: 'product',
              id: 'abc',
              price: 19.99,
              currency: 'EUR',
              inStock: false,
            },
          ],
        },
      }
      const result = generateSchema(doc)
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Test Product',
        offers: {
          '@type': 'Offer',
          price: 19.99,
          priceCurrency: 'EUR',
          availability: 'https://schema.org/OutOfStock',
        },
      })
    })
  })

  describe('Service Schema', () => {
    test('generates minimal service schema', () => {
      const doc = {
        title: 'Test Service',
        meta: {
          structuredData: [{ blockType: 'service', id: 'abc' }],
        },
      }
      const result = generateSchema(doc)
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Test Service',
      })
    })

    test('generates full service schema with all fields', () => {
      const doc = {
        title: 'Test Service',
        meta: {
          structuredData: [
            {
              blockType: 'service',
              id: 'abc',
              serviceType: 'Consulting',
              provider: 'ACME Corp',
              areaServed: 'United States',
            },
          ],
        },
      }
      const result = generateSchema(doc)
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Test Service',
        serviceType: 'Consulting',
        provider: {
          '@type': 'Organization',
          name: 'ACME Corp',
        },
        areaServed: 'United States',
      })
    })
  })

  describe('Event Schema', () => {
    test('generates event schema with required start date', () => {
      const doc = {
        title: 'Test Event',
        meta: {
          structuredData: [
            {
              blockType: 'event',
              id: 'abc',
              startDate: '2023-12-01T10:00:00Z',
            },
          ],
        },
      }
      const result = generateSchema(doc)
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Test Event',
        startDate: '2023-12-01T10:00:00Z',
      })
    })

    test('returns null when event start date is missing', () => {
      const doc = {
        title: 'Test Event',
        meta: {
          structuredData: [
            {
              blockType: 'event',
              id: 'abc',
            },
          ],
        },
      }
      const result = generateSchema(doc)
      expect(result).toBeNull()
    })

    test('generates full event schema with location', () => {
      const doc = {
        title: 'Test Event',
        meta: {
          structuredData: [
            {
              blockType: 'event',
              id: 'abc',
              startDate: '2023-12-01T10:00:00Z',
              endDate: '2023-12-01T12:00:00Z',
              locationName: 'Conference Center',
              locationAddress: '123 Main St, City, State',
            },
          ],
        },
      }
      const result = generateSchema(doc)
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Test Event',
        startDate: '2023-12-01T10:00:00Z',
        endDate: '2023-12-01T12:00:00Z',
        location: {
          '@type': 'Place',
          name: 'Conference Center',
          address: '123 Main St, City, State',
        },
      })
    })
  })

  describe('Local Business Schema', () => {
    test('generates minimal local business schema', () => {
      const doc = {
        title: 'Test Business',
        meta: {
          structuredData: [{ blockType: 'localBusiness', id: 'abc' }],
        },
      }
      const result = generateSchema(doc)
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Test Business',
      })
    })

    test('generates local business with custom address', () => {
      const doc = {
        title: 'Test Business',
        meta: {
          structuredData: [
            {
              blockType: 'localBusiness',
              id: 'abc',
              businessType: 'Restaurant',
              priceRange: '$$',
              address: {
                streetAddress: '123 Main St',
                city: 'Anytown',
                state: 'CA',
                postalCode: '12345',
                country: 'US',
              },
            },
          ],
        },
      }
      const result = generateSchema(doc)
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: 'Test Business',
        priceRange: '$$',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '123 Main St',
          addressLocality: 'Anytown',
          addressRegion: 'CA',
          postalCode: '12345',
          addressCountry: 'US',
        },
      })
    })

    test('uses global address when useGlobalAddress is true', () => {
      const doc = {
        title: 'Test Business',
        meta: {
          structuredData: [
            {
              blockType: 'localBusiness',
              id: 'abc',
              useGlobalAddress: true,
            },
          ],
        },
      }
      const globalSettings = {
        knowledgeGraph: [
          {
            blockType: 'organization',
            id: 'xyz',
            address: {
              streetAddress: '456 Global St',
              city: 'Global City',
              state: 'NY',
              postalCode: '67890',
              country: 'US',
            },
          },
        ],
      }
      const result = generateSchema(doc, globalSettings)
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Test Business',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '456 Global St',
          addressLocality: 'Global City',
          addressRegion: 'NY',
          postalCode: '67890',
          addressCountry: 'US',
        },
      })
    })

    test('uses global address when useGlobalAddress is true, even if local address exists', () => {
      const doc = {
        title: 'Test Business',
        meta: {
          structuredData: [
            {
              blockType: 'localBusiness',
              id: 'abc',
              useGlobalAddress: true,
              address: {
                streetAddress: '123 Local St',
                city: 'Local City',
                state: 'CA',
                postalCode: '12345',
                country: 'US',
              },
            },
          ],
        },
      }
      const globalSettings = {
        knowledgeGraph: [
          {
            blockType: 'organization',
            id: 'xyz',
            address: {
              streetAddress: '456 Global St',
              city: 'Global City',
              state: 'NY',
              postalCode: '67890',
              country: 'US',
            },
          },
        ],
      }
      const result = generateSchema(doc, globalSettings)
      expect(result?.address?.streetAddress).toBe('456 Global St')
    })

    test('handles missing global address gracefully', () => {
      const doc = {
        title: 'Test Business',
        meta: {
          structuredData: [
            {
              blockType: 'localBusiness',
              id: 'abc',
              useGlobalAddress: true,
            },
          ],
        },
      }
      const globalSettings = {}
      const result = generateSchema(doc, globalSettings)
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Test Business',
      })
    })
  })

  describe('Data Cleaning Function', () => {
    test('removes undefined, null, and empty string values', () => {
      const doc = {
        title: 'Test Article',
        meta: {
          description: '',
          structuredData: [
            {
              blockType: 'article',
              id: 'abc',
              author: undefined,
              publishDate: null,
            },
          ],
        },
      }
      const result = generateSchema(doc)
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test Article',
      })
    })

    test('removes empty objects after cleaning', () => {
      const doc = {
        title: 'Test Article',
        meta: {
          structuredData: [
            {
              blockType: 'article',
              id: 'abc',
              author: 'John Doe',
              publishDate: undefined,
            },
          ],
        },
      }
      const result = generateSchema(doc)
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test Article',
        author: {
          '@type': 'Person',
          name: 'John Doe',
        },
      })
    })

    test('preserves zero and false values', () => {
      const doc = {
        title: 'Test Product',
        meta: {
          structuredData: [
            {
              blockType: 'product',
              id: 'abc',
              price: 0,
              inStock: false,
            },
          ],
        },
      }
      const result = generateSchema(doc)
      expect(result?.offers?.price).toBe(0)
      expect(result?.offers?.availability).toBe('https://schema.org/OutOfStock')
    })
  })
})
