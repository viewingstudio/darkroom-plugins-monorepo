import { DEFAULT_MAX_LENGTH, PREAMBLE_PATTERNS } from '../defaults.js'

const QUOTE_PAIRS: [string, string][] = [
  ['"', '"'],
  ["'", "'"],
  ['“', '”'],
  ['‘', '’'],
]

/** Sentence-ending punctuation that already terminates the caption acceptably. */
const TERMINAL_PUNCTUATION_RE = /[.!?…]$/

/**
 * `maxLength` is a soft target aimed at by the prompt, not a hard cap enforced here — chopping a
 * well-formed sentence mid-thought to hit an exact character count produces worse alt text than
 * a slightly longer one. Truncation below only exists as a safety net for output that blows way
 * past the target (a misbehaving model, a prompt override with no length instruction), so it only
 * engages once text is this many times over `maxLength`.
 */
const TRUNCATION_CEILING_MULTIPLIER = 2

/**
 * Conjunctions, prepositions, and articles that can't legally end a sentence. Truncation on a
 * word boundary (or the model simply running out of tokens) can leave one of these dangling —
 * `ensureTerminalPunctuation` would otherwise turn "...shelf and" into the nonsensical "...shelf
 * and."
 */
const DANGLING_TRAILING_WORD_RE =
  /\s(?:a|an|the|and|or|but|nor|so|yet|as|of|in|on|at|to|for|from|by|with|without|near|over|under|into|onto|through|during|before|after|about)$/i

function stripWrappingQuotes(input: string): string {
  let text = input
  let stripped = true

  while (stripped) {
    stripped = false
    for (const [open, close] of QUOTE_PAIRS) {
      if (text.length >= 2 && text.startsWith(open) && text.endsWith(close)) {
        text = text.slice(open.length, text.length - close.length).trim()
        stripped = true
        break
      }
    }
  }

  return text
}

function stripPreambles(input: string): string {
  let text = input
  let stripped = true

  while (stripped) {
    stripped = false
    for (const pattern of PREAMBLE_PATTERNS) {
      const match = text.match(pattern)
      if (match && match.index === 0) {
        text = text.slice(match[0].length)
        stripped = true
        break
      }
    }
  }

  return text
}

function stripDanglingTrailingWords(input: string): string {
  let text = input

  while (true) {
    const match = text.match(DANGLING_TRAILING_WORD_RE)
    if (!match || match.index === undefined) {
      return text
    }

    const candidate = text.slice(0, match.index).trimEnd()
    // Never strip past a single remaining word — an all-connector caption should stay as-is
    // rather than being whittled down to nothing.
    if (!candidate.includes(' ') && candidate.length === 0) {
      return text
    }

    text = candidate
  }
}

function ensureTerminalPunctuation(input: string): string {
  if (!input || TERMINAL_PUNCTUATION_RE.test(input)) {
    return input
  }

  return `${input}.`
}

function truncateOnWordBoundary(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input
  }

  let truncated = input.slice(0, maxLength)

  if (/\S/.test(input[maxLength]) && /\S$/.test(truncated)) {
    const lastSpace = truncated.lastIndexOf(' ')
    if (lastSpace > 0) {
      truncated = truncated.slice(0, lastSpace)
    }
  }

  truncated = truncated.trimEnd()
  truncated = truncated.replace(/[\s.,;:!?-]+$/, '')

  return truncated
}

function capitalizeFirst(input: string): string {
  if (!input) {
    return input
  }

  const first = input[0]
  if (first >= 'a' && first <= 'z') {
    return first.toUpperCase() + input.slice(1)
  }

  return input
}

export function sanitizeAltText(raw: string | null | undefined, maxLength?: number): string {
  if (raw == null) {
    return ''
  }

  let text = raw.replace(/\s+/g, ' ').trim()

  if (!text) {
    return ''
  }

  text = stripWrappingQuotes(text)
  text = stripPreambles(text)
  text = stripWrappingQuotes(text)
  text = text.trim()

  if (!text) {
    return ''
  }

  const target = maxLength ?? DEFAULT_MAX_LENGTH
  const ceiling = target * TRUNCATION_CEILING_MULTIPLIER

  if (text.length > ceiling) {
    text = truncateOnWordBoundary(text, Math.max(ceiling - 1, 0))
  }

  // Only relevant when we're about to append a full stop below — text that already ends with
  // its own terminal punctuation (an exclamation mark, say) is left exactly as the model wrote it.
  if (!TERMINAL_PUNCTUATION_RE.test(text)) {
    text = stripDanglingTrailingWords(text)
  }

  text = capitalizeFirst(text)
  text = ensureTerminalPunctuation(text)

  return text
}
