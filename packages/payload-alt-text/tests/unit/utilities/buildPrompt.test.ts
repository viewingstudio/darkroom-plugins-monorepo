import { describe, expect, test } from 'vitest'

import { buildPrompt } from '../../../src/utilities/buildPrompt.js'

describe('buildPrompt', () => {
  test('base instruction is present with no settings at all', () => {
    const prompt = buildPrompt({}, {})

    expect(prompt.length).toBeGreaterThan(0)
    expect(prompt).toContain('125 characters')
  })

  test('businessDescription clause appears only when provided', () => {
    const withClause = buildPrompt({ businessDescription: 'a bakery in Bristol' }, {})
    const without = buildPrompt({}, {})

    expect(withClause).toContain('a bakery in Bristol')
    expect(without).not.toContain('bakery')
  })

  test('location clause appears only when provided', () => {
    const withClause = buildPrompt({ location: 'London, UK' }, {})
    const without = buildPrompt({}, {})

    expect(withClause).toContain('London, UK')
    expect(without).not.toContain('located in')
  })

  test('tone clause appears only when provided', () => {
    const withClause = buildPrompt({ tone: 'warm and plain-spoken' }, {})
    const without = buildPrompt({}, {})

    expect(withClause).toContain('warm and plain-spoken')
    expect(without).not.toContain('House style')
  })

  test('avoidTerms clause appears only when provided', () => {
    const withClause = buildPrompt({ avoidTerms: ['stunning', 'amazing'] }, {})
    const without = buildPrompt({}, {})

    expect(withClause).toContain('stunning')
    expect(withClause).toContain('amazing')
    expect(without).not.toContain('Never use any of the following')
  })

  test('whitespace-only values are treated as absent', () => {
    const prompt = buildPrompt(
      {
        businessDescription: '   ',
        location: '\n\t',
        tone: '  ',
        avoidTerms: ['   ', ''],
      },
      {},
    )

    expect(prompt).not.toContain('located in')
    expect(prompt).not.toContain('House style')
    expect(prompt).not.toContain('Never use any of the following')
  })

  test('avoidTerms renders every term', () => {
    const prompt = buildPrompt({ avoidTerms: ['moist', 'delicious', 'yummy'] }, {})

    expect(prompt).toContain('moist')
    expect(prompt).toContain('delicious')
    expect(prompt).toContain('yummy')
  })

  test('empty avoidTerms array is treated as absent', () => {
    const prompt = buildPrompt({ avoidTerms: [] }, {})

    expect(prompt).not.toContain('Never use any of the following')
  })

  test('maxLength is interpolated and defaults to 125', () => {
    const defaultPrompt = buildPrompt({}, {})
    const customPrompt = buildPrompt({}, { maxLength: 80 })

    expect(defaultPrompt).toContain('125 characters')
    expect(customPrompt).toContain('80 characters')
  })

  test('output contains no keyword-stuffing or SEO instruction', () => {
    const prompt = buildPrompt(
      {
        avoidTerms: ['stunning'],
        businessDescription: 'a bakery in Bristol',
        location: 'London, UK',
        tone: 'warm and plain-spoken',
      },
      {},
    )

    expect(prompt).not.toMatch(/keyword/i)
    expect(prompt).not.toMatch(/\bSEO\b/i)
  })

  test('output has no leading/trailing whitespace and no triple newline', () => {
    const prompt = buildPrompt(
      {
        avoidTerms: ['stunning'],
        businessDescription: 'a bakery in Bristol',
        location: 'London, UK',
        tone: 'warm and plain-spoken',
      },
      {},
    )

    expect(prompt).toEqual(prompt.trim())
    expect(prompt).not.toMatch(/\n\n\n/)
  })
})
