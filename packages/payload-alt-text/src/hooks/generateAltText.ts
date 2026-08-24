import type { CollectionBeforeValidateHook, PayloadRequest } from 'payload'

import type { ResolvedAltTextOptions } from '../types.js'

import { AltTextError } from '../types.js'
import { getProvider, getProviderCapabilities, resolveApiKey } from '../providers/index.js'
import { buildPrompt } from '../utilities/buildPrompt.js'
import { humanizeFilename } from '../utilities/humanizeFilename.js'
import { resolveSettings } from '../utilities/resolveSettings.js'
import { sanitizeAltText } from '../utilities/sanitizeAltText.js'

const hasValue = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0

const toBase64 = (input: unknown): string => {
  if (typeof input === 'string') {
    return input
  }
  return Buffer.from(input as Buffer).toString('base64')
}

const warn = (req: PayloadRequest, message: string) => {
  req.payload?.logger?.warn?.(message)
}

/**
 * beforeValidate, not afterChange: `alt` is typically `required`, so an empty value on create
 * fails validation before afterChange ever runs. Also, at this point the uploaded bytes are
 * still in memory at `req.file.data`, so generation needs no storage round-trip.
 */
export const generateAltTextHook =
  (options: ResolvedAltTextOptions): CollectionBeforeValidateHook =>
  async ({ data, req }) => {
    if (!options.autoGenerate || !data) {
      return data
    }

    if (hasValue(data[options.altFieldName])) {
      return data
    }

    const file = req.file

    if (!file?.data) {
      return data
    }

    const capabilities = getProviderCapabilities(options.provider)

    if (!capabilities.supportedMimeTypes.includes(file.mimetype)) {
      return data
    }

    try {
      const apiKey = resolveApiKey(options)

      if (!apiKey) {
        throw new AltTextError('invalid_key', `${capabilities.label} API key is missing`)
      }

      if (file.size && file.size > capabilities.maxImageBytes) {
        throw new AltTextError(
          'bad_request',
          `Image is ${file.size} bytes, over the ${capabilities.maxImageBytes} byte limit for ${capabilities.label}`,
        )
      }

      const settings = await resolveSettings({ options, req })
      const prompt = buildPrompt(settings, { maxLength: options.maxLength })
      const base64 = toBase64(file.data)

      const raw = await getProvider(options.provider)({
        apiKey,
        base64,
        maxLength: options.maxLength,
        mimeType: file.mimetype,
        model: options.model,
        prompt,
        timeoutMs: options.timeoutMs,
      })

      const result = sanitizeAltText(raw, options.maxLength)

      if (result) {
        return { ...data, [options.altFieldName]: result }
      }

      throw new AltTextError('no_content', 'Generated alt text sanitized to an empty string')
    } catch (error) {
      const code = error instanceof AltTextError ? error.code : undefined
      const message = error instanceof Error ? error.message : String(error)

      if (options.onError === 'throw') {
        throw error
      }

      if (options.onError === 'empty') {
        warn(req, `[payload-alt-text] generation failed${code ? ` (${code})` : ''}: ${message}`)
        return data
      }

      warn(req, `[payload-alt-text] generation failed${code ? ` (${code})` : ''}: ${message}`)
      const fallback = humanizeFilename(file.name ?? data.filename)

      if (!fallback) {
        return data
      }

      return { ...data, [options.altFieldName]: fallback }
    }
  }
