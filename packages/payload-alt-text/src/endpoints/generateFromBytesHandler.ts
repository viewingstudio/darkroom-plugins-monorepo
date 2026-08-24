import type { PayloadHandler } from 'payload'

import type { ResolvedAltTextOptions } from '../types.js'

import { AltTextError } from '../types.js'
import { errorStatus } from './errorStatus.js'
import { generateFromBytes } from '../utilities/generateFromBytes.js'

type RequestBody = {
  base64?: string
  mimeType?: string
}

/**
 * Backs pre-save generation: the admin downscales the pending file in-browser and posts the
 * bytes here, so the `alt` field is already populated by the time the upload request runs.
 *
 * Why this exists at all, rather than generating inside the upload hook: Payload opens a
 * database transaction for the whole of a mutating HTTP request, so a hook that awaits a vision
 * API pins a pooler connection for the length of that call (up to `timeoutMs`, 15s by default).
 * A handful of concurrent uploads then exhausts Supavisor's client-connection limit. This
 * handler performs no writes, so it holds no transaction while waiting on the provider.
 *
 * Keep it that way: do not add a `payload.create`/`update` call here.
 */
export const createGenerateFromBytesHandler =
  (options: ResolvedAltTextOptions): PayloadHandler =>
  async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: RequestBody = (await req.json?.()) ?? {}
    const { base64, mimeType } = body

    if (!base64 || !mimeType) {
      return Response.json({ error: 'base64 and mimeType are required' }, { status: 400 })
    }

    try {
      const result = await generateFromBytes({ base64, mimeType, options, req })

      return Response.json({ result }, { status: 200 })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Alt text generation failed'
      const status = error instanceof AltTextError ? (errorStatus[error.code] ?? 500) : 500

      req.payload?.logger?.error?.(`[payload-alt-text] generate failed: ${message}`)

      return Response.json({ error: message }, { status })
    }
  }
