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
    expect(sanitizeAltText('A  cat\n\nsitting   on\ta  mat')).toBe('A cat sitting on a mat.')
  })

  test('trims leading and trailing whitespace', () => {
    expect(sanitizeAltText('  a red car  ')).toBe('A red car.')
  })

  test('strips straight double quotes wrapping the whole string', () => {
    expect(sanitizeAltText('"a red car"')).toBe('A red car.')
  })

  test('strips straight single quotes wrapping the whole string', () => {
    expect(sanitizeAltText("'a red car'")).toBe('A red car.')
  })

  test('strips curly double quotes wrapping the whole string', () => {
    expect(sanitizeAltText('“a red car”')).toBe('A red car.')
  })

  test('strips curly single quotes wrapping the whole string', () => {
    expect(sanitizeAltText('‘a red car’')).toBe('A red car.')
  })

  test('strips repeated/mismatched wrapping quotes', () => {
    expect(sanitizeAltText(`"'a red car'"`)).toBe('A red car.')
  })

  test('does not strip quotes that only wrap part of the string', () => {
    expect(sanitizeAltText('a car named "Herbie"')).toBe('A car named "Herbie".')
  })

  test('strips a single preamble pattern', () => {
    expect(sanitizeAltText('Image of a red car')).toBe('A red car.')
  })

  test('strips repeated preambles until none match', () => {
    expect(sanitizeAltText('Image of a photo of a red car')).toBe('A red car.')
  })

  test('strips "this image shows" preamble', () => {
    expect(sanitizeAltText('This image shows a red car')).toBe('A red car.')
  })

  test('strips "alt text:" preamble', () => {
    expect(sanitizeAltText('Alt text: a red car')).toBe('A red car.')
  })

  test('strips preamble then quotes wrapping remainder', () => {
    expect(sanitizeAltText('Image of "a red car"')).toBe('A red car.')
  })

  test('appends a full stop when the model omits one', () => {
    expect(sanitizeAltText('A red car parked outside')).toBe('A red car parked outside.')
  })

  test('keeps a single existing trailing full stop rather than doubling it', () => {
    expect(sanitizeAltText('A red car parked outside.')).toBe('A red car parked outside.')
  })

  test('leaves multi-sentence text alone, including trailing period', () => {
    expect(sanitizeAltText('A red car. It is parked outside.')).toBe(
      'A red car. It is parked outside.',
    )
  })

  test('terminates multi-sentence text that is missing its final full stop', () => {
    expect(sanitizeAltText('Is that a red car? It looks fast')).toBe(
      'Is that a red car? It looks fast.',
    )
  })

  test('leaves an exclamation mark as the terminator rather than adding a full stop', () => {
    expect(sanitizeAltText('What a red car!')).toBe('What a red car!')
  })

  test('leaves a question mark as the terminator rather than adding a full stop', () => {
    expect(sanitizeAltText('Is that a red car?')).toBe('Is that a red car?')
  })

  test('leaves an ellipsis as the terminator rather than adding a full stop', () => {
    expect(sanitizeAltText('A red car, mid-turn…')).toBe('A red car, mid-turn…')
  })

  test('always ends with terminal punctuation for any non-empty input', () => {
    const inputs = [
      'a red car',
      '"a red car"',
      'Image of a red car',
      '123 red cars',
      'A red car parked outside the house today',
    ]

    for (const input of inputs) {
      expect(sanitizeAltText(input, 20)).toMatch(/[.!?…]$/)
    }
  })

  // maxLength is a soft target for the prompt, not a hard cap: text that's only somewhat over
  // it — the normal case, since models don't count characters exactly — is left alone rather
  // than chopped mid-sentence.
  test('does not truncate text that is only moderately over maxLength', () => {
    const raw = 'A red car parked'
    expect(sanitizeAltText(raw, 12)).toBe('A red car parked.')
  })

  test('does not truncate text shorter than maxLength', () => {
    expect(sanitizeAltText('A red car', 125)).toBe('A red car.')
  })

  test('the appended full stop is allowed to push text past maxLength', () => {
    expect(sanitizeAltText('A red car', 9)).toBe('A red car.')
  })

  // Truncation only kicks in as a safety net once text is well beyond maxLength — a genuinely
  // runaway response, not routine model verbosity.
  test('truncates on a word boundary once text is far beyond maxLength', () => {
    const raw = 'A red car parked outside a large house near the old oak tree by the river'
    const result = sanitizeAltText(raw, 12)
    expect(result.length).toBeLessThan(raw.length)
    expect(result).toMatch(/\.$/)
  })

  test('truncation never leaves a trailing space or dangling punctuation before the full stop', () => {
    const raw =
      'A red car, parked outside, near the house, beside the garden, under the old oak tree, by the river'
    const result = sanitizeAltText(raw, 11)
    expect(result).toMatch(/\.$/)
    expect(result.slice(0, -1)).not.toMatch(/[\s,.;:!?-]$/)
  })

  test('truncation does not append an ellipsis', () => {
    const raw =
      'A red car parked outside the house today, waiting for someone to come and drive it away'
    const result = sanitizeAltText(raw, 15)
    expect(result).not.toContain('...')
    expect(result).not.toContain('…')
  })

  test('uses DEFAULT_MAX_LENGTH when maxLength is omitted', () => {
    const raw = 'a '.repeat(100).trim()
    const result = sanitizeAltText(raw)
    expect(result.length).toBeLessThanOrEqual(250)
  })

  test('capitalizes a lowercase first character', () => {
    expect(sanitizeAltText('a red car')).toBe('A red car.')
  })

  test('leaves an already-capitalized first character untouched', () => {
    expect(sanitizeAltText('A red car')).toBe('A red car.')
  })

  test('leaves a non-letter first character untouched', () => {
    expect(sanitizeAltText('123 red cars')).toBe('123 red cars.')
  })

  test('drops a dangling conjunction left behind by truncation instead of appending a stop after it', () => {
    const raw = 'A row of vintage cameras displayed on a wooden shelf and lit by warm light'
    const result = sanitizeAltText(raw, 45)
    expect(result).not.toMatch(/\b(a|an|the|and|or|but|of|in|on|at|to|for|from|by|with)\.$/i)
  })

  test('does not touch text that already ends with its own terminal punctuation', () => {
    expect(sanitizeAltText('A cat sitting on a mat and staring at a bird!')).toBe(
      'A cat sitting on a mat and staring at a bird!',
    )
  })

  test('drops an untruncated but dangling conjunction the model forgot to finish', () => {
    expect(sanitizeAltText('A red car parked outside the house and')).toBe(
      'A red car parked outside the house.',
    )
  })
})
