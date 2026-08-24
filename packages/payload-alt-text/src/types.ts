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
  /** Gemini API key. Falls back to `process.env.GEMINI_API_KEY`. */
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
  /** Max characters of generated alt text. Default: 125 */
  maxLength?: number
  /** Gemini model id. Default: 'gemini-3.1-flash-lite' */
  model?: string
  /** Default: 'filename' */
  onError?: OnErrorStrategy
  /** Replace the whole prompt, ignoring the settings global entirely. */
  prompt?: string
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
  settingsSlug?: string
  sizeName?: string
  timeoutMs: number
  tone?: string
}

/** Image bytes ready to inline into a Gemini request. */
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
