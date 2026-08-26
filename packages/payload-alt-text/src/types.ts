import type { CollectionSlug, Field, GlobalConfig } from 'payload'

export type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]

/**
 * What to do when generation fails.
 * - `filename` — fall back to a humanized version of the uploaded filename. Default, because
 *   `alt` is typically `required` and a failed API call must not block the upload.
 * - `empty` — leave the field empty and let validation decide.
 * - `throw` — surface the error and fail the operation.
 */
export type OnErrorStrategy = 'empty' | 'filename' | 'throw'

/** Vision API used to generate the description. */
export type AltTextProvider = 'anthropic' | 'gemini'

export type AltTextSettingsConfig = {
  access?: GlobalConfig['access']
  /** Admin nav group. Defaults to an existing 'Settings' group when one exists. */
  adminGroup?: string
  fieldsOverride?: FieldsOverride
  /** Default: 'alt-text-settings' */
  slug?: string
}

export type PayloadAltTextConfig = {
  /** Field on the collection to populate. Default: 'alt' */
  altFieldName?: string
  /**
   * Provider API key. Falls back to `process.env.ANTHROPIC_API_KEY` or `process.env.GEMINI_API_KEY`,
   * whichever matches the resolved provider.
   */
  apiKey?: string
  /** Generate automatically when a new file is uploaded. Default: true */
  autoGenerate?: boolean
  /** Terms the model must never use. Fallback for the global's `avoidTerms`. */
  avoidTerms?: string[]
  /** What the business does. Fallback for the global's `businessDescription`. */
  businessContext?: string
  /** Collection slugs to enable. Default: ['media'] */
  collections?: ({} | CollectionSlug)[]
  /** Kill switch — returns the config untouched. */
  disabled?: boolean
  /** Adds the admin-editable settings global. Default: false */
  globalSettings?: AltTextSettingsConfig | boolean
  /** Business location, e.g. 'London, UK'. Fallback for the global's `location`. */
  location?: string
  /** Target character length of generated alt text — a guideline given to the model, not a hard cap. Default: 125 */
  maxLength?: number
  /**
   * Model id for the resolved provider. Defaults to that provider's cheap vision tier:
   * 'gemini-3.1-flash-lite' or 'claude-haiku-4-5-20251001'.
   */
  model?: string
  /** Default: 'filename' */
  onError?: OnErrorStrategy
  /** Replace the whole prompt, ignoring the settings global entirely. */
  prompt?: string
  /**
   * Vision API to use. Default: inferred from `model` (a `claude-*` id means `'anthropic'`),
   * and `'gemini'` when neither is set.
   */
  provider?: AltTextProvider
  /** Show the manual Generate button on the field. Default: true */
  showGenerateButton?: boolean
  /** Prefer this generated size when resolving bytes. Default: smallest available. */
  sizeName?: string
  /** House style instruction. Fallback for the global's `tone`. */
  tone?: string
  /** Request timeout in ms. Default: 15000 */
  timeoutMs?: number
}

/**
 * Prompt-shaping context, merged from the settings global and the plugin options.
 * Empty values are normalized to `undefined` so `buildPrompt` can skip clauses cleanly.
 */
export type AltTextSettings = {
  avoidTerms?: string[]
  businessDescription?: string
  location?: string
  tone?: string
}

/** Plugin options after defaults have been applied. Passed to hooks and endpoint handlers. */
export type ResolvedAltTextOptions = {
  altFieldName: string
  apiKey?: string
  autoGenerate: boolean
  avoidTerms?: string[]
  businessContext?: string
  location?: string
  maxLength: number
  model: string
  onError: OnErrorStrategy
  prompt?: string
  provider: AltTextProvider
  settingsSlug?: string
  sizeName?: string
  timeoutMs: number
  tone?: string
}

/** Image bytes ready to inline into a provider request. */
export type ResolvedImage = {
  base64: string
  mimeType: string
}

export type GenerateAltTextArgs = {
  apiKey: string
  base64: string
  maxLength: number
  mimeType: string
  model: string
  prompt: string
  timeoutMs: number
}

/** The one function every provider module implements. */
export type GenerateAltTextFn = (args: GenerateAltTextArgs) => Promise<string>

/** What a provider will accept in a request, used to gate images before one is sent. */
export type ProviderCapabilities = {
  /** Env var consulted when no `apiKey` option is set. */
  apiKeyEnvVar: string
  /** Human-readable provider name, used in error messages. */
  label: string
  /** Largest raw image the provider accepts, in bytes, before base64 expansion. */
  maxImageBytes: number
  /** Mime types the provider's vision endpoint accepts. */
  supportedMimeTypes: string[]
}

export type AltTextErrorCode =
  | 'bad_request'
  | 'invalid_key'
  | 'no_content'
  | 'rate_limited'
  | 'server_error'
  | 'timeout'
  | 'unknown'

/** Thrown by the provider so callers can map a cause to a useful message. */
export class AltTextError extends Error {
  code: AltTextErrorCode
  status?: number

  constructor(code: AltTextErrorCode, message: string, status?: number) {
    super(message)
    this.name = 'AltTextError'
    this.code = code
    this.status = status
  }
}
