import { DEFAULT_MAX_LENGTH, PREAMBLE_PATTERNS } from '../defaults.js'

const QUOTE_PAIRS: [string, string][] = [
  ['"', '"'],
  ["'", "'"],
  ['“', '”'],
  ['‘', '’'],
]

const SENTENCE_END_RE = /[.!?]/g

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

function stripTrailingPeriodIfSingleSentence(input: string): string {
  if (!input.endsWith('.')) {
    return input
  }

  const withoutTrailing = input.slice(0, -1)
  const remainingSentenceEnders = withoutTrailing.match(SENTENCE_END_RE)

  if (remainingSentenceEnders && remainingSentenceEnders.length > 0) {
    return input
  }

  return withoutTrailing
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

  text = stripTrailingPeriodIfSingleSentence(text)
  text = truncateOnWordBoundary(text, maxLength ?? DEFAULT_MAX_LENGTH)
  text = capitalizeFirst(text)

  return text
}
