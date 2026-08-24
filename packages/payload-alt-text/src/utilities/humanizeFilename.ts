const HEX_HASH_RE = /^[0-9a-f]{6,}$/i

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Matches a UUID as a whole trailing token before hyphens get turned into spaces. */
const TRAILING_UUID_RE = /[-_]?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const LONG_DIGIT_RUN_RE = /^\d{5,}$/

function isNoiseToken(token: string): boolean {
  return HEX_HASH_RE.test(token) || UUID_RE.test(token) || LONG_DIGIT_RUN_RE.test(token)
}

function stripDirectory(input: string): string {
  const segments = input.split(/[/\\]/)
  return segments[segments.length - 1] ?? input
}

function stripExtension(input: string): string {
  const lastDot = input.lastIndexOf('.')
  if (lastDot === 0) {
    // Dotfile, e.g. '.gitkeep' — the leading dot makes the whole name a hidden-file marker,
    // not a basename.
    return ''
  }
  if (lastDot < 0) {
    return input
  }
  return input.slice(0, lastDot)
}

function splitCamelCase(input: string): string {
  return input.replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2').replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
}

export function humanizeFilename(filename: string | null | undefined): string {
  if (!filename) {
    return ''
  }

  let name = stripDirectory(filename)
  name = stripExtension(name)

  if (!name) {
    return ''
  }

  name = name.replace(TRAILING_UUID_RE, '')
  name = name.replace(/%20/gi, ' ').replace(/[-_.+]/g, ' ')
  name = splitCamelCase(name)
  name = name.replace(/\s+/g, ' ').trim()

  if (!name) {
    return ''
  }

  const tokens = name.split(' ')
  while (tokens.length > 0 && isNoiseToken(tokens[tokens.length - 1])) {
    tokens.pop()
  }
  name = tokens.join(' ').replace(/\s+/g, ' ').trim()

  if (!name) {
    return ''
  }

  const first = name[0]
  return first.toUpperCase() + name.slice(1)
}
