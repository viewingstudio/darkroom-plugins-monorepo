import type { CollectionBeforeChangeHook } from 'payload'

import type { GenerateURL } from '../types.js'

interface PopulateCanonicalUrlArgs {
  generateURL?: GenerateURL
  serverURL?: string
}

export const populateCanonicalUrl =
  ({ generateURL, serverURL }: PopulateCanonicalUrlArgs): CollectionBeforeChangeHook =>
  async ({ collection, data, req }) => {
    // Skip if canonical URL is already set
    if (data?.meta?.canonicalUrl) {
      return data
    }

    let canonicalUrl: string | undefined

    if (generateURL) {
      try {
        canonicalUrl = await generateURL({
          collectionConfig: collection,
          doc: data,
          req,
        } as any)
      } catch {
        // Fall through to default construction
      }
    }

    if (!canonicalUrl) {
      const baseUrl = serverURL ?? ''
      const slug = data?.slug || data?.id
      if (slug) {
        canonicalUrl = `${baseUrl}/${collection.slug}/${slug}`
      }
    }

    if (canonicalUrl) {
      return {
        ...data,
        meta: {
          ...(data?.meta ?? {}),
          canonicalUrl,
        },
      }
    }

    return data
  }
