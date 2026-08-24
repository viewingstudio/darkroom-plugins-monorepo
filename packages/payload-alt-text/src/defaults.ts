/**
 * `gemini-2.5-flash-lite` is cheaper still, but is retired on 2026-10-16. Flash-Lite 3.1 is the
 * durable low-cost vision tier: a <=384px image is a flat 258 input tokens, so a generated alt
 * text costs on the order of $0.00016.
 */
export const DEFAULT_MODEL = 'gemini-3.1-flash-lite'

export const DEFAULT_ALT_FIELD_NAME = 'alt'

export const DEFAULT_COLLECTIONS = ['media']

export const DEFAULT_SETTINGS_SLUG = 'alt-text-settings'

export const DEFAULT_ADMIN_GROUP = 'Settings'

/** Roughly the point where screen readers and search engines both stop caring. */
export const DEFAULT_MAX_LENGTH = 125

export const DEFAULT_TIMEOUT_MS = 15000

/** Gemini caps inline request bodies at 20MB; leave headroom for base64 expansion and JSON. */
export const MAX_IMAGE_BYTES = 14 * 1024 * 1024

export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

/** Short captions only — keeps a runaway response from becoming a runaway bill. */
export const MAX_OUTPUT_TOKENS = 100

export const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]

/**
 * Preambles the model tends to add despite being told not to. Screen readers already announce
 * the element as an image, so these waste the first few words.
 */
export const PREAMBLE_PATTERNS = [
  /^(an?\s+)?(image|photo|photograph|picture|screenshot|illustration|graphic)\s+(of|showing|depicting)\s+/i,
  /^this\s+(image|photo|picture)\s+(shows|depicts|is)\s+/i,
  /^(alt\s*text|alt)\s*:\s*/i,
]
