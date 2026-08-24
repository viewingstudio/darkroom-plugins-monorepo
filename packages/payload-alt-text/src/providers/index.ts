import type { AltTextProvider, GenerateAltTextFn, ProviderCapabilities } from '../types.js'

import {
  ANTHROPIC_MAX_IMAGE_BYTES,
  ANTHROPIC_SUPPORTED_MIME_TYPES,
  DEFAULT_PROVIDER,
  MAX_IMAGE_BYTES,
  SUPPORTED_MIME_TYPES,
} from '../defaults.js'
import { generateAltText as anthropic } from './anthropic.js'
import { generateAltText as gemini } from './gemini.js'

const generators: Record<AltTextProvider, GenerateAltTextFn> = {
  anthropic,
  gemini,
}

export const PROVIDER_CAPABILITIES: Record<AltTextProvider, ProviderCapabilities> = {
  anthropic: {
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    label: 'Anthropic',
    maxImageBytes: ANTHROPIC_MAX_IMAGE_BYTES,
    supportedMimeTypes: ANTHROPIC_SUPPORTED_MIME_TYPES,
  },
  gemini: {
    apiKeyEnvVar: 'GEMINI_API_KEY',
    label: 'Gemini',
    maxImageBytes: MAX_IMAGE_BYTES,
    supportedMimeTypes: SUPPORTED_MIME_TYPES,
  },
}

const isProvider = (value: unknown): value is AltTextProvider =>
  value === 'anthropic' || value === 'gemini'

/**
 * An explicit `provider` always wins. Otherwise the model id decides, so that setting only
 * `model: 'claude-…'` does the obvious thing rather than posting a Claude id to Gemini.
 */
export const resolveProviderName = (options: {
  model?: string
  provider?: AltTextProvider
}): AltTextProvider => {
  if (isProvider(options.provider)) {
    return options.provider
  }

  const model = options.model?.trim().toLowerCase()

  if (model?.startsWith('claude')) {
    return 'anthropic'
  }

  if (model?.startsWith('gemini')) {
    return 'gemini'
  }

  return DEFAULT_PROVIDER
}

export const getProviderCapabilities = (provider?: AltTextProvider): ProviderCapabilities =>
  PROVIDER_CAPABILITIES[isProvider(provider) ? provider : DEFAULT_PROVIDER]

export const getProvider = (provider?: AltTextProvider): GenerateAltTextFn =>
  generators[isProvider(provider) ? provider : DEFAULT_PROVIDER]

/** Resolves the key for the given provider: explicit option first, then that provider's env var. */
export const resolveApiKey = (args: {
  apiKey?: string
  provider?: AltTextProvider
}): string | undefined => {
  const explicit = args.apiKey?.trim()

  if (explicit) {
    return explicit
  }

  return process.env[getProviderCapabilities(args.provider).apiKeyEnvVar] || undefined
}
