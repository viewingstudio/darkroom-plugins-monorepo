import type { PayloadHandler } from 'payload'

import type { ResolvedAltTextOptions } from '../types.js'

import { AltTextError } from '../types.js'
import { getProvider, getProviderCapabilities, resolveApiKey } from '../providers/index.js'
import { buildPrompt } from '../utilities/buildPrompt.js'
import { resolveImageBytes } from '../utilities/resolveImageBytes.js'
import { resolveSettings } from '../utilities/resolveSettings.js'
import { sanitizeAltText } from '../utilities/sanitizeAltText.js'

type RequestBody = {
  collectionSlug?: string
  id?: number | string
}

const errorStatus: Record<string, number> = {
  bad_request: 400,
  invalid_key: 500,
  no_content: 422,
  rate_limited: 429,
  server_error: 502,
  timeout: 504,
  unknown: 500,
}

/**
 * Backs the manual Generate button. Unlike the upload hook there is no `req.file` here, so the
 * stored image is fetched back out of storage by URL. Returns the text rather than writing it,
 * so the editor reviews before saving.
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

    const capabilities = getProviderCapabilities(options.provider)
    const apiKey = resolveApiKey(options)

    if (!apiKey) {
      return Response.json(
        {
          error: `No ${capabilities.label} API key configured. Set ${capabilities.apiKeyEnvVar}.`,
        },
        { status: 500 },
      )
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

      const settings = await resolveSettings({ options, req })
      const prompt = options.prompt ?? buildPrompt(settings, { maxLength: options.maxLength })

      const raw = await getProvider(options.provider)({
        apiKey,
        base64,
        maxLength: options.maxLength,
        mimeType,
        model: options.model,
        prompt,
        timeoutMs: options.timeoutMs,
      })

      const result = sanitizeAltText(raw, options.maxLength)

      if (!result) {
        return Response.json(
          { error: 'The model returned no usable description for this image.' },
          { status: 422 },
        )
      }

      return Response.json({ result }, { status: 200 })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Alt text generation failed'
      const status = error instanceof AltTextError ? (errorStatus[error.code] ?? 500) : 500

      req.payload?.logger?.error?.(`[payload-alt-text] generate failed: ${message}`)

      return Response.json({ error: message }, { status })
    }
  }
