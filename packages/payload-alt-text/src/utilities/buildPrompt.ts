import type { AltTextSettings } from '../types.js'
import { DEFAULT_MAX_LENGTH } from '../defaults.js'

const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim()

const isPresent = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0

export const buildPrompt = (settings: AltTextSettings, opts: { maxLength?: number }): string => {
  const maxLength = opts.maxLength ?? DEFAULT_MAX_LENGTH

  const clauses: string[] = [
    [
      `Write alt text describing what is visibly in the image, for someone using a screen reader.`,
      `Use one sentence, under ${maxLength} characters, ending with a full stop.`,
      `Do not begin with "image of", "photo of", or similar preamble.`,
      `Return plain text only — no quotes, no markdown, no labels.`,
      `If the image is purely decorative or has no meaningful content, return an empty string.`,
    ].join(' '),
  ]

  if (isPresent(settings.businessDescription)) {
    clauses.push(
      [
        `Context, for vocabulary only: the business is ${normalize(settings.businessDescription)}.`,
        `Use this solely to name things with the correct domain vocabulary and appropriate specificity.`,
        `Describe only what is actually visible in the image — do not mention the business, do not`,
        `stuff in extra terms for search purposes, and do not invent details the image does not support.`,
      ].join(' '),
    )
  }

  if (isPresent(settings.location)) {
    clauses.push(
      [
        `The business is located in ${normalize(settings.location)}.`,
        `Let this inform place-specific description only where the image visually supports it —`,
        `never assert a location that isn't visible in the image.`,
      ].join(' '),
    )
  }

  if (isPresent(settings.tone)) {
    clauses.push(`House style: ${normalize(settings.tone)}`)
  }

  const avoidTerms = (settings.avoidTerms ?? []).filter(isPresent).map((term) => normalize(term))

  if (avoidTerms.length > 0) {
    clauses.push(`Never use any of the following words or phrases: ${avoidTerms.join(', ')}.`)
  }

  return clauses.map((clause) => clause.trim()).join('\n\n')
}
