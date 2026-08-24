import type { PayloadRequest } from 'payload'

import type { ResolvedAltTextOptions } from '../types.js'

import { AltTextError } from '../types.js'
import { getProvider, getProviderCapabilities, resolveApiKey } from '../providers/index.js'
import { buildPrompt } from './buildPrompt.js'
import { resolveSettings } from './resolveSettings.js'
import { sanitizeAltText } from './sanitizeAltText.js'

type GenerateFromBytesArgs = {
  base64: string
  mimeType: string
  options: ResolvedAltTextOptions
  req: PayloadRequest
}

/**
 * The one place a provider is called. Shared by both endpoints so prompt assembly, sanitizing
 * and the capability gate cannot drift between the pre-save and post-save paths.
 *
 * Deliberately takes bytes rather than a document: resolving bytes is the caller's problem
 * (in-browser downscale before save, storage round-trip after), and keeping that out of here is
 * what lets neither path touch a write operation.
 */
export const generateFromBytes = async ({
  base64,
  mimeType,
  options,
  req,
}: GenerateFromBytesArgs): Promise<string> => {
  const capabilities = getProviderCapabilities(options.provider)

  if (!capabilities.supportedMimeTypes.includes(mimeType)) {
    throw new AltTextError('bad_request', `${capabilities.label} does not accept ${mimeType}`)
  }

  const apiKey = resolveApiKey(options)

  if (!apiKey) {
    throw new AltTextError(
      'invalid_key',
      `No ${capabilities.label} API key configured. Set ${capabilities.apiKeyEnvVar}.`,
    )
  }

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
    throw new AltTextError('no_content', 'The model returned no usable description for this image.')
  }

  return result
}
