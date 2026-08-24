import type { PayloadHandler } from 'payload'

import type { ResolvedAltTextOptions } from '../types.js'

import { AltTextError } from '../types.js'
import { errorStatus } from './errorStatus.js'
import { generateFromBytes } from '../utilities/generateFromBytes.js'
import { resolveImageBytes } from '../utilities/resolveImageBytes.js'

type RequestBody = {
  collectionSlug?: string
  id?: number | string
}

/**
 * Backs the manual Generate button on an already-saved document. No `req.file` here, so the
 * stored image is fetched back out of storage by URL. Returns the text rather than writing it,
 * so the editor reviews before saving.
 *
 * Read-only by design — see the note in `generateFromBytesHandler` on why neither generation
 * path may perform a write.
 */
export const createGenerateAltHandler =
  (options: ResolvedAltTextOptions): PayloadHandler =>
  async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: RequestBody = (await req.json?.()) ?? {}
    const { collectionSlug, id } = body

    if (!collectionSlug || id === undefined || id === null || id === '') {
      return Response.json({ error: 'collectionSlug and id are required' }, { status: 400 })
    }

    try {
      const doc = await req.payload.findByID({
        collection: collectionSlug as Parameters<typeof req.payload.findByID>[0]['collection'],
        id,
        overrideAccess: false,
        req,
        user: req.user,
      })

      if (!doc) {
        return Response.json({ error: 'Document not found' }, { status: 404 })
      }

      const { base64, mimeType } = await resolveImageBytes({
        doc: doc as Record<string, unknown>,
        provider: options.provider,
        serverURL: req.payload.config.serverURL,
        sizeName: options.sizeName,
        timeoutMs: options.timeoutMs,
      })

      const result = await generateFromBytes({ base64, mimeType, options, req })

      return Response.json({ result }, { status: 200 })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Alt text generation failed'
      const status = error instanceof AltTextError ? (errorStatus[error.code] ?? 500) : 500

      req.payload?.logger?.error?.(`[payload-alt-text] generate failed: ${message}`)

      return Response.json({ error: message }, { status })
    }
  }
