import type { CollectionBeforeValidateHook } from 'payload'

import type { ResolvedAltTextOptions } from '../types.js'

import { humanizeFilename } from '../utilities/humanizeFilename.js'

const hasValue = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0

/**
 * Guarantees `alt` has *a* value on upload, without calling a vision API.
 *
 * This hook used to generate the alt text itself. It cannot: Payload opens a database
 * transaction for the whole of a mutating HTTP request, so awaiting a vision API here pinned a
 * pooler connection for the length of that call — up to `timeoutMs` (15s by default) per upload
 * instead of the ~10ms a normal write takes. Concurrent uploads then multiplied that into
 * connection-pool exhaustion at the pooler's client limit, which is a hard outage for every
 * other request against the same database.
 *
 * There is no post-commit collection hook to move the call into, so real generation happens
 * outside the write path entirely:
 * - before save, from the admin, via `POST /plugin-alt-text/generate-from-bytes`
 * - after save, via the Generate button and `POST /plugin-alt-text/generate`
 *
 * Both leave `alt` already populated by the time this runs, so the `hasValue` check below short
 * -circuits and the humanized filename is only a floor for uploads that arrive some other way
 * (REST, Local API, MCP), where it keeps a `required` field from blocking the upload.
 *
 * Do not reintroduce a provider call here.
 */
export const generateAltTextHook =
  (options: ResolvedAltTextOptions): CollectionBeforeValidateHook =>
  ({ data, req }) => {
    if (!options.autoGenerate || !data) {
      return data
    }

    if (hasValue(data[options.altFieldName])) {
      return data
    }

    // `empty` opts out of a placeholder and lets validation decide.
    if (options.onError === 'empty') {
      return data
    }

    const fallback = humanizeFilename(req.file?.name ?? (data.filename as string | undefined))

    if (!fallback) {
      return data
    }

    return { ...data, [options.altFieldName]: fallback }
  }
