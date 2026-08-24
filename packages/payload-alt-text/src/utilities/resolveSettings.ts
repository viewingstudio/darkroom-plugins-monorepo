import type { PayloadRequest } from 'payload'

import type { AltTextSettings, ResolvedAltTextOptions } from '../types.js'

type ResolveSettingsArgs = {
  options: ResolvedAltTextOptions
  req: PayloadRequest
}

const cleanString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const normalizeAvoidTerms = (value: unknown): string[] | undefined => {
  let raw: unknown[]

  if (Array.isArray(value)) {
    raw = value
  } else if (typeof value === 'string') {
    raw = value.split(',')
  } else {
    return undefined
  }

  const terms: string[] = []
  const seen = new Set<string>()

  for (const entry of raw) {
    let term: string | undefined

    if (typeof entry === 'string') {
      term = entry.trim()
    } else if (entry && typeof entry === 'object') {
      const shape = entry as { term?: unknown; value?: unknown }
      term = cleanString(shape.term) ?? cleanString(shape.value)
    }

    if (!term) {
      continue
    }

    const key = term.toLowerCase()
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    terms.push(term)
  }

  return terms.length > 0 ? terms : undefined
}

/**
 * One indexed global read per upload, no caching — deliberate. It's negligible next to the
 * ~1s vision API call that follows.
 */
export async function resolveSettings({
  options,
  req,
}: ResolveSettingsArgs): Promise<AltTextSettings> {
  const fallback: AltTextSettings = {
    avoidTerms: normalizeAvoidTerms(options.avoidTerms),
    businessDescription: cleanString(options.businessContext),
    location: cleanString(options.location),
    tone: cleanString(options.tone),
  }

  if (!options.settingsSlug) {
    return fallback
  }

  let global: Record<string, unknown> | undefined

  try {
    global = (await req.payload.findGlobal({ slug: options.settingsSlug })) as Record<
      string,
      unknown
    >
  } catch (error) {
    try {
      req.payload?.logger?.warn?.(
        `[payload-alt-text] failed to read settings global "${options.settingsSlug}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    } catch {
      // logger itself may be missing or throw; never let logging crash resolution
    }
    return fallback
  }

  return {
    avoidTerms: normalizeAvoidTerms(global?.avoidTerms) ?? fallback.avoidTerms,
    businessDescription: cleanString(global?.businessDescription) ?? fallback.businessDescription,
    location: cleanString(global?.location) ?? fallback.location,
    tone: cleanString(global?.tone) ?? fallback.tone,
  }
}
