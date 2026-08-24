import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ResolvedAltTextOptions } from '../../../src/types.js'

import { generateAltText as generateAltTextAnthropic } from '../../../src/providers/anthropic.js'
import { generateAltText } from '../../../src/providers/gemini.js'
import { AltTextError } from '../../../src/types.js'
import { buildPrompt } from '../../../src/utilities/buildPrompt.js'
import { resolveSettings } from '../../../src/utilities/resolveSettings.js'
import { sanitizeAltText } from '../../../src/utilities/sanitizeAltText.js'
import { generateFromBytes } from '../../../src/utilities/generateFromBytes.js'

vi.mock('../../../src/utilities/buildPrompt.js', () => ({
  buildPrompt: vi.fn(),
}))

vi.mock('../../../src/utilities/resolveSettings.js', () => ({
  resolveSettings: vi.fn(),
}))

vi.mock('../../../src/utilities/sanitizeAltText.js', () => ({
  sanitizeAltText: vi.fn(),
}))

vi.mock('../../../src/providers/gemini.js', () => ({
  generateAltText: vi.fn(),
}))

vi.mock('../../../src/providers/anthropic.js', () => ({
  generateAltText: vi.fn(),
}))

const baseOptions: ResolvedAltTextOptions = {
  altFieldName: 'alt',
  apiKey: 'test-key',
  autoGenerate: true,
  maxLength: 125,
  model: 'gemini-3.1-flash-lite',
  onError: 'filename',
  provider: 'gemini',
  timeoutMs: 15000,
}

const req = { payload: { logger: { warn: vi.fn() } } } as any

const args = { base64: 'aGVsbG8=', mimeType: 'image/jpeg', req }

describe('generateFromBytes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveSettings).mockResolvedValue({})
    vi.mocked(buildPrompt).mockReturnValue('the prompt')
    vi.mocked(generateAltText).mockResolvedValue('raw alt text')
    vi.mocked(generateAltTextAnthropic).mockResolvedValue('raw alt text')
    vi.mocked(sanitizeAltText).mockReturnValue('Sanitized alt text')
  })

  it('returns sanitized text and calls the provider once with the assembled prompt', async () => {
    const result = await generateFromBytes({ ...args, options: baseOptions })

    expect(result).toBe('Sanitized alt text')
    expect(generateAltText).toHaveBeenCalledTimes(1)
    expect(generateAltText).toHaveBeenCalledWith({
      apiKey: 'test-key',
      base64: 'aGVsbG8=',
      maxLength: 125,
      mimeType: 'image/jpeg',
      model: 'gemini-3.1-flash-lite',
      prompt: 'the prompt',
      timeoutMs: 15000,
    })
  })

  it('routes to the provider named in options', async () => {
    await generateFromBytes({
      ...args,
      options: { ...baseOptions, model: 'claude-haiku-4-5-20251001', provider: 'anthropic' },
    })

    expect(generateAltTextAnthropic).toHaveBeenCalledTimes(1)
    expect(generateAltText).not.toHaveBeenCalled()
  })

  it('an explicit prompt option bypasses the settings global entirely', async () => {
    await generateFromBytes({
      ...args,
      options: { ...baseOptions, prompt: 'verbatim prompt' },
    })

    expect(buildPrompt).not.toHaveBeenCalled()
    expect(generateAltText).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'verbatim prompt' }),
    )
  })

  it('rejects an unsupported mime type before spending a request', async () => {
    await expect(
      generateFromBytes({ ...args, mimeType: 'image/tiff', options: baseOptions }),
    ).rejects.toBeInstanceOf(AltTextError)

    expect(generateAltText).not.toHaveBeenCalled()
  })

  it('rejects when no API key is configured', async () => {
    const options = { ...baseOptions, apiKey: undefined }
    vi.stubEnv('GEMINI_API_KEY', '')

    await expect(generateFromBytes({ ...args, options })).rejects.toBeInstanceOf(AltTextError)
    expect(generateAltText).not.toHaveBeenCalled()

    vi.unstubAllEnvs()
  })

  it('rejects when sanitizing leaves nothing usable', async () => {
    vi.mocked(sanitizeAltText).mockReturnValue('')

    await expect(generateFromBytes({ ...args, options: baseOptions })).rejects.toBeInstanceOf(
      AltTextError,
    )
  })

  it('propagates a provider error rather than swallowing it', async () => {
    vi.mocked(generateAltText).mockRejectedValue(new AltTextError('rate_limited', 'slow down'))

    await expect(generateFromBytes({ ...args, options: baseOptions })).rejects.toMatchObject({
      code: 'rate_limited',
    })
  })
})
