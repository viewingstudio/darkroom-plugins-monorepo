import { describe, expect, test } from 'vitest'

import { sanitizeAltText } from '../../../src/utilities/sanitizeAltText.js'

describe('sanitizeAltText', () => {
  test('returns empty string for null', () => {
    expect(sanitizeAltText(null)).toBe('')
  })

  test('returns empty string for undefined', () => {
    expect(sanitizeAltText(undefined)).toBe('')
  })

  test('returns empty string for whitespace-only input', () => {
    expect(sanitizeAltText('   \n\t  ')).toBe('')
  })

  test('returns empty string for empty string', () => {
    expect(sanitizeAltText('')).toBe('')
  })

  test('collapses internal whitespace runs including newlines', () => {
    expect(sanitizeAltText('A  cat\n\nsitting   on\ta  mat')).toBe('A cat sitting on a mat')
  })

  test('trims leading and trailing whitespace', () => {
    expect(sanitizeAltText('  a red car  ')).toBe('A red car')
  })

  test('strips straight double quotes wrapping the whole string', () => {
    expect(sanitizeAltText('"a red car"')).toBe('A red car')
  })

  test('strips straight single quotes wrapping the whole string', () => {
    expect(sanitizeAltText("'a red car'")).toBe('A red car')
  })

  test('strips curly double quotes wrapping the whole string', () => {
    expect(sanitizeAltText('“a red car”')).toBe('A red car')
  })

  test('strips curly single quotes wrapping the whole string', () => {
    expect(sanitizeAltText('‘a red car’')).toBe('A red car')
  })

  test('strips repeated/mismatched wrapping quotes', () => {
    expect(sanitizeAltText(`"'a red car'"`)).toBe('A red car')
  })

  test('does not strip quotes that only wrap part of the string', () => {
    expect(sanitizeAltText('a car named "Herbie"')).toBe('A car named "Herbie"')
  })

  test('strips a single preamble pattern', () => {
    expect(sanitizeAltText('Image of a red car')).toBe('A red car')
  })

  test('strips repeated preambles until none match', () => {
    expect(sanitizeAltText('Image of a photo of a red car')).toBe('A red car')
  })

  test('strips "this image shows" preamble', () => {
    expect(sanitizeAltText('This image shows a red car')).toBe('A red car')
  })

  test('strips "alt text:" preamble', () => {
    expect(sanitizeAltText('Alt text: a red car')).toBe('A red car')
  })

  test('strips preamble then quotes wrapping remainder', () => {
    expect(sanitizeAltText('Image of "a red car"')).toBe('A red car')
  })

  test('removes trailing period on a single sentence', () => {
    expect(sanitizeAltText('A red car parked outside.')).toBe('A red car parked outside')
  })

  test('leaves trailing period-free single sentence untouched', () => {
    expect(sanitizeAltText('A red car parked outside')).toBe('A red car parked outside')
  })

  test('leaves multi-sentence text alone, including trailing period', () => {
    expect(sanitizeAltText('A red car. It is parked outside.')).toBe(
      'A red car. It is parked outside.',
    )
  })

  test('leaves text with internal sentence-ending punctuation alone even without trailing period', () => {
    expect(sanitizeAltText('Is that a red car? It looks fast')).toBe(
      'Is that a red car? It looks fast',
    )
  })

  test('leaves a single exclamation-ended sentence alone (not a period)', () => {
    expect(sanitizeAltText('What a red car!')).toBe('What a red car!')
  })

  test('truncates to maxLength on a word boundary when the cut lands mid-word', () => {
    const raw = 'A red car parked outside the house'
    // Cutting at 12 chars lands inside "parked" ("A red car pa")
    expect(sanitizeAltText(raw, 12)).toBe('A red car')
  })

  test('truncates exactly at a word boundary without losing the last word', () => {
    const raw = 'A red car parked'
    // Exactly the length of the full string minus " outside" - cut right at a space boundary
    expect(sanitizeAltText(raw, 9)).toBe('A red car')
  })

  test('truncation never leaves a trailing space or dangling punctuation', () => {
    const raw = 'A red car, parked outside, near the house'
    const result = sanitizeAltText(raw, 11)
    expect(result).not.toMatch(/[\s,.;:!?-]$/)
  })

  test('truncation does not append an ellipsis', () => {
    const raw = 'A red car parked outside the house today'
    const result = sanitizeAltText(raw, 15)
    expect(result).not.toContain('...')
    expect(result).not.toContain('…')
  })

  test('does not truncate text shorter than maxLength', () => {
    expect(sanitizeAltText('A red car', 125)).toBe('A red car')
  })

  test('uses DEFAULT_MAX_LENGTH when maxLength is omitted', () => {
    const raw = 'a '.repeat(100).trim()
    const result = sanitizeAltText(raw)
    expect(result.length).toBeLessThanOrEqual(125)
  })

  test('capitalizes a lowercase first character', () => {
    expect(sanitizeAltText('a red car')).toBe('A red car')
  })

  test('leaves an already-capitalized first character untouched', () => {
    expect(sanitizeAltText('A red car')).toBe('A red car')
  })

  test('leaves a non-letter first character untouched', () => {
    expect(sanitizeAltText('123 red cars')).toBe('123 red cars')
  })
})
