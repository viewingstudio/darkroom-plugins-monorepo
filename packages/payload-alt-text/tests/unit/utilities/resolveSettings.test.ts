import { describe, expect, test, vi } from 'vitest'

import { resolveSettings } from '../../../src/utilities/resolveSettings.js'

import type { ResolvedAltTextOptions } from '../../../src/types.js'

const baseOptions: ResolvedAltTextOptions = {
  altFieldName: 'alt',
  autoGenerate: true,
  maxLength: 125,
  model: 'gemini-3.1-flash-lite',
  onError: 'filename',
  timeoutMs: 15000,
}

const makeReq = (findGlobal: (...args: any[]) => any, withLogger = true) =>
  ({
    payload: {
      findGlobal: vi.fn(findGlobal),
      ...(withLogger ? { logger: { warn: vi.fn() } } : {}),
    },
  }) as any

describe('resolveSettings', () => {
  test('skips the DB entirely when settingsSlug is undefined', async () => {
    const req = makeReq(() => {
      throw new Error('should not be called')
    })

    const result = await resolveSettings({
      options: { ...baseOptions, businessContext: 'a bakery in Bristol', tone: 'friendly' },
      req,
    })

    expect(req.payload.findGlobal).not.toHaveBeenCalled()
    expect(result).toEqual({
      avoidTerms: undefined,
      businessDescription: 'a bakery in Bristol',
      location: undefined,
      tone: 'friendly',
    })
  })

  test('global value wins over the option', async () => {
    const req = makeReq(() => ({
      businessDescription: 'a global bakery',
      location: 'Bristol',
      tone: 'formal',
    }))

    const result = await resolveSettings({
      options: {
        ...baseOptions,
        businessContext: 'option bakery',
        location: 'London',
        settingsSlug: 'alt-text-settings',
        tone: 'friendly',
      },
      req,
    })

    expect(result.businessDescription).toBe('a global bakery')
    expect(result.location).toBe('Bristol')
    expect(result.tone).toBe('formal')
  })

  test('empty, whitespace-only, or null global value falls through to the option', async () => {
    const req = makeReq(() => ({
      businessDescription: '   ',
      location: null,
      tone: '',
    }))

    const result = await resolveSettings({
      options: {
        ...baseOptions,
        businessContext: 'option bakery',
        location: 'London',
        settingsSlug: 'alt-text-settings',
        tone: 'friendly',
      },
      req,
    })

    expect(result.businessDescription).toBe('option bakery')
    expect(result.location).toBe('London')
    expect(result.tone).toBe('friendly')
  })

  test('findGlobal rejecting falls back to options without throwing', async () => {
    const req = makeReq(() => {
      throw new Error('global not migrated yet')
    })

    const result = await resolveSettings({
      options: {
        ...baseOptions,
        businessContext: 'option bakery',
        settingsSlug: 'alt-text-settings',
      },
      req,
    })

    expect(result.businessDescription).toBe('option bakery')
    expect(req.payload.logger.warn).toHaveBeenCalled()
  })

  test('missing req.payload.logger while findGlobal rejects does not crash', async () => {
    const req = makeReq(() => {
      throw new Error('boom')
    }, false)

    await expect(
      resolveSettings({
        options: {
          ...baseOptions,
          businessContext: 'option bakery',
          settingsSlug: 'alt-text-settings',
        },
        req,
      }),
    ).resolves.toEqual({
      avoidTerms: undefined,
      businessDescription: 'option bakery',
      location: undefined,
      tone: undefined,
    })
  })

  describe('avoidTerms normalization', () => {
    test('accepts a string array', async () => {
      const req = makeReq(() => ({ avoidTerms: ['stunning', 'amazing'] }))
      const result = await resolveSettings({
        options: { ...baseOptions, settingsSlug: 'alt-text-settings' },
        req,
      })
      expect(result.avoidTerms).toEqual(['stunning', 'amazing'])
    })

    test('accepts a comma-separated string', async () => {
      const req = makeReq(() => ({ avoidTerms: 'stunning, amazing ,  gorgeous' }))
      const result = await resolveSettings({
        options: { ...baseOptions, settingsSlug: 'alt-text-settings' },
        req,
      })
      expect(result.avoidTerms).toEqual(['stunning', 'amazing', 'gorgeous'])
    })

    test('accepts a Payload array-field shape', async () => {
      const req = makeReq(() => ({
        avoidTerms: [
          { id: '1', term: 'stunning' },
          { id: '2', value: 'amazing' },
        ],
      }))
      const result = await resolveSettings({
        options: { ...baseOptions, settingsSlug: 'alt-text-settings' },
        req,
      })
      expect(result.avoidTerms).toEqual(['stunning', 'amazing'])
    })

    test('de-duplicates case-insensitively and drops empty entries', async () => {
      const req = makeReq(() => ({
        avoidTerms: ['Stunning', 'stunning', '  ', '', 'AMAZING', 'amazing'],
      }))
      const result = await resolveSettings({
        options: { ...baseOptions, settingsSlug: 'alt-text-settings' },
        req,
      })
      expect(result.avoidTerms).toEqual(['Stunning', 'AMAZING'])
    })

    test('an empty result is undefined, not []', async () => {
      const req = makeReq(() => ({ avoidTerms: ['   ', ''] }))
      const result = await resolveSettings({
        options: { ...baseOptions, settingsSlug: 'alt-text-settings' },
        req,
      })
      expect(result.avoidTerms).toBeUndefined()
    })

    test('falls through to the option avoidTerms when the global has none', async () => {
      const req = makeReq(() => ({}))
      const result = await resolveSettings({
        options: {
          ...baseOptions,
          avoidTerms: ['cheap', 'basic'],
          settingsSlug: 'alt-text-settings',
        },
        req,
      })
      expect(result.avoidTerms).toEqual(['cheap', 'basic'])
    })
  })

  test('all empty everywhere resolves to every field undefined', async () => {
    const req = makeReq(() => ({}))
    const result = await resolveSettings({
      options: { ...baseOptions, settingsSlug: 'alt-text-settings' },
      req,
    })

    expect(result).toEqual({
      avoidTerms: undefined,
      businessDescription: undefined,
      location: undefined,
      tone: undefined,
    })
  })
})
