import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { generateAltText as anthropic } from '../../../src/providers/anthropic.js'
import { generateAltText as gemini } from '../../../src/providers/gemini.js'
import {
  getProvider,
  getProviderCapabilities,
  resolveApiKey,
  resolveProviderName,
} from '../../../src/providers/index.js'

describe('resolveProviderName', () => {
  test('defaults to gemini when nothing is set', () => {
    expect(resolveProviderName({})).toBe('gemini')
  })

  test('an explicit provider wins over the model id', () => {
    expect(resolveProviderName({ model: 'gemini-3.1-flash-lite', provider: 'anthropic' })).toBe(
      'anthropic',
    )
    expect(resolveProviderName({ model: 'claude-haiku-4-5-20251001', provider: 'gemini' })).toBe(
      'gemini',
    )
  })

  test('infers anthropic from a claude model id', () => {
    expect(resolveProviderName({ model: 'claude-haiku-4-5-20251001' })).toBe('anthropic')
    expect(resolveProviderName({ model: 'CLAUDE-SONNET-5' })).toBe('anthropic')
    expect(resolveProviderName({ model: '  claude-opus-5  ' })).toBe('anthropic')
  })

  test('infers gemini from a gemini model id', () => {
    expect(resolveProviderName({ model: 'gemini-3.1-flash-lite' })).toBe('gemini')
  })

  test('falls back to gemini for an unrecognized model id', () => {
    expect(resolveProviderName({ model: 'some-other-vision-model' })).toBe('gemini')
  })

  test('ignores a bogus provider value rather than throwing', () => {
    expect(resolveProviderName({ provider: 'openai' as any })).toBe('gemini')
    expect(
      resolveProviderName({ model: 'claude-haiku-4-5-20251001', provider: 'openai' as any }),
    ).toBe('anthropic')
  })
})

describe('getProvider', () => {
  test('returns the matching generator', () => {
    expect(getProvider('anthropic')).toBe(anthropic)
    expect(getProvider('gemini')).toBe(gemini)
  })

  test('falls back to gemini for undefined or unknown', () => {
    expect(getProvider(undefined)).toBe(gemini)
    expect(getProvider('nope' as any)).toBe(gemini)
  })
})

describe('getProviderCapabilities', () => {
  test('anthropic accepts no HEIC/HEIF and a smaller image', () => {
    const caps = getProviderCapabilities('anthropic')

    expect(caps.apiKeyEnvVar).toBe('ANTHROPIC_API_KEY')
    expect(caps.label).toBe('Anthropic')
    expect(caps.supportedMimeTypes).toEqual(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    expect(caps.supportedMimeTypes).not.toContain('image/heic')
    // 5MB after base64 expansion, so 3.75MB of raw bytes.
    expect(caps.maxImageBytes).toBe(3932160)
  })

  test('gemini keeps HEIC/HEIF and the larger cap', () => {
    const caps = getProviderCapabilities('gemini')

    expect(caps.apiKeyEnvVar).toBe('GEMINI_API_KEY')
    expect(caps.supportedMimeTypes).toContain('image/heic')
    expect(caps.maxImageBytes).toBe(14 * 1024 * 1024)
  })

  test('defaults to gemini for undefined', () => {
    expect(getProviderCapabilities(undefined)).toBe(getProviderCapabilities('gemini'))
  })
})

describe('resolveApiKey', () => {
  const original = { ...process.env }

  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.GEMINI_API_KEY
  })

  afterEach(() => {
    process.env = { ...original }
  })

  test('an explicit key wins over the environment', () => {
    process.env.ANTHROPIC_API_KEY = 'from-env'
    expect(resolveApiKey({ apiKey: 'explicit', provider: 'anthropic' })).toBe('explicit')
  })

  test('trims an explicit key', () => {
    expect(resolveApiKey({ apiKey: '  explicit  ', provider: 'anthropic' })).toBe('explicit')
  })

  test('reads ANTHROPIC_API_KEY for anthropic', () => {
    process.env.ANTHROPIC_API_KEY = 'ant-key'
    process.env.GEMINI_API_KEY = 'gem-key'
    expect(resolveApiKey({ provider: 'anthropic' })).toBe('ant-key')
  })

  test('reads GEMINI_API_KEY for gemini', () => {
    process.env.ANTHROPIC_API_KEY = 'ant-key'
    process.env.GEMINI_API_KEY = 'gem-key'
    expect(resolveApiKey({ provider: 'gemini' })).toBe('gem-key')
  })

  test('does not cross-read the other provider key', () => {
    process.env.GEMINI_API_KEY = 'gem-key'
    expect(resolveApiKey({ provider: 'anthropic' })).toBeUndefined()
  })

  test('an empty explicit key falls through to the environment', () => {
    process.env.ANTHROPIC_API_KEY = 'ant-key'
    expect(resolveApiKey({ apiKey: '   ', provider: 'anthropic' })).toBe('ant-key')
  })

  test('returns undefined when nothing is set', () => {
    expect(resolveApiKey({ provider: 'anthropic' })).toBeUndefined()
  })
})
