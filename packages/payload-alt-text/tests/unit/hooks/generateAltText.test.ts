import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ResolvedAltTextOptions } from '../../../src/types.js'

import { generateAltText as generateAltTextAnthropic } from '../../../src/providers/anthropic.js'
import { generateAltText } from '../../../src/providers/gemini.js'
import { AltTextError } from '../../../src/types.js'
import { buildPrompt } from '../../../src/utilities/buildPrompt.js'
import { humanizeFilename } from '../../../src/utilities/humanizeFilename.js'
import { resolveSettings } from '../../../src/utilities/resolveSettings.js'
import { sanitizeAltText } from '../../../src/utilities/sanitizeAltText.js'
import { generateAltTextHook } from '../../../src/hooks/generateAltText.js'

vi.mock('../../../src/utilities/buildPrompt.js', () => ({
  buildPrompt: vi.fn(),
}))

vi.mock('../../../src/utilities/resolveSettings.js', () => ({
  resolveSettings: vi.fn(),
}))

vi.mock('../../../src/utilities/sanitizeAltText.js', () => ({
  sanitizeAltText: vi.fn(),
}))

vi.mock('../../../src/utilities/humanizeFilename.js', () => ({
  humanizeFilename: vi.fn(),
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

const anthropicOptions: ResolvedAltTextOptions = {
  ...baseOptions,
  model: 'claude-haiku-4-5-20251001',
  provider: 'anthropic',
}

const makeReq = (overrides: Record<string, unknown> = {}) =>
  ({
    file: {
      data: Buffer.from('x'),
      name: 'my-photo.jpg',
      mimetype: 'image/jpeg',
    },
    payload: {
      logger: { warn: vi.fn() },
    },
    ...overrides,
  }) as any

describe('generateAltTextHook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveSettings).mockResolvedValue({})
    vi.mocked(buildPrompt).mockReturnValue('the prompt')
    vi.mocked(generateAltText).mockResolvedValue('raw alt text')
    vi.mocked(generateAltTextAnthropic).mockResolvedValue('raw alt text')
    vi.mocked(sanitizeAltText).mockReturnValue('Sanitized alt text')
    vi.mocked(humanizeFilename).mockReturnValue('My photo')
  })

  it('happy path: sets the field and calls the provider once with expected args', async () => {
    const hook = generateAltTextHook(baseOptions)
    const req = makeReq()
    const data = { filename: 'my-photo.jpg' }

    const result: any = await hook({ data, req } as any)

    expect(result[baseOptions.altFieldName]).toBe('Sanitized alt text')
    expect(generateAltText).toHaveBeenCalledTimes(1)
    expect(generateAltText).toHaveBeenCalledWith({
      apiKey: 'test-key',
      base64: Buffer.from('x').toString('base64'),
      maxLength: 125,
      mimeType: 'image/jpeg',
      model: 'gemini-3.1-flash-lite',
      prompt: 'the prompt',
      timeoutMs: 15000,
    })
  })

  describe('provider routing', () => {
    it('calls Anthropic and not Gemini when provider is anthropic', async () => {
      const hook = generateAltTextHook(anthropicOptions)
      const req = makeReq()
      const data = { filename: 'my-photo.jpg' }

      const result: any = await hook({ data, req } as any)

      expect(result.alt).toBe('Sanitized alt text')
      expect(generateAltText).not.toHaveBeenCalled()
      expect(generateAltTextAnthropic).toHaveBeenCalledWith({
        apiKey: 'test-key',
        base64: Buffer.from('x').toString('base64'),
        maxLength: 125,
        mimeType: 'image/jpeg',
        model: 'claude-haiku-4-5-20251001',
        prompt: 'the prompt',
        timeoutMs: 15000,
      })
    })

    it('reads ANTHROPIC_API_KEY rather than GEMINI_API_KEY', async () => {
      delete process.env.GEMINI_API_KEY
      process.env.ANTHROPIC_API_KEY = 'ant-env-key'

      const hook = generateAltTextHook({ ...anthropicOptions, apiKey: undefined })
      const req = makeReq()

      await hook({ data: { filename: 'my-photo.jpg' }, req } as any)

      expect(generateAltTextAnthropic).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: 'ant-env-key' }),
      )

      delete process.env.ANTHROPIC_API_KEY
    })

    it('skips HEIC for anthropic but generates for gemini', async () => {
      const req = makeReq({
        file: { data: Buffer.from('x'), name: 'f.heic', mimetype: 'image/heic' },
      })

      const skipped: any = await generateAltTextHook(anthropicOptions)({
        data: {},
        req,
      } as any)
      expect(generateAltTextAnthropic).not.toHaveBeenCalled()
      expect(skipped.alt).toBeUndefined()

      const generated: any = await generateAltTextHook(baseOptions)({
        data: { filename: 'f.heic' },
        req,
      } as any)
      expect(generated.alt).toBe('Sanitized alt text')
    })

    it('takes the onError path when the file exceeds the provider size cap', async () => {
      const hook = generateAltTextHook(anthropicOptions)
      const req = makeReq({
        file: {
          data: Buffer.from('x'),
          mimetype: 'image/jpeg',
          name: 'huge.jpg',
          size: 5 * 1024 * 1024,
        },
      })

      const result: any = await hook({ data: { filename: 'huge.jpg' }, req } as any)

      expect(generateAltTextAnthropic).not.toHaveBeenCalled()
      expect(result.alt).toBe('My photo')
    })

    it('generates when the file is under the provider size cap', async () => {
      const hook = generateAltTextHook(anthropicOptions)
      const req = makeReq({
        file: {
          data: Buffer.from('x'),
          mimetype: 'image/jpeg',
          name: 'small.jpg',
          size: 1024,
        },
      })

      const result: any = await hook({ data: { filename: 'small.jpg' }, req } as any)

      expect(generateAltTextAnthropic).toHaveBeenCalledTimes(1)
      expect(result.alt).toBe('Sanitized alt text')
    })
  })

  it('does not mutate the original data object', async () => {
    const hook = generateAltTextHook(baseOptions)
    const req = makeReq()
    const data = { filename: 'my-photo.jpg' }
    const original = { ...data }

    const result: any = await hook({ data, req } as any)

    expect(data).toEqual(original)
    expect(result).not.toBe(data)
  })

  it('skips when autoGenerate is false', async () => {
    const hook = generateAltTextHook({ ...baseOptions, autoGenerate: false })
    const req = makeReq()
    const data = {}

    const result: any = await hook({ data, req } as any)

    expect(result).toBe(data)
    expect(generateAltText).not.toHaveBeenCalled()
  })

  it('skips when the field already has a non-empty value', async () => {
    const hook = generateAltTextHook(baseOptions)
    const req = makeReq()
    const data = { alt: 'Already set' }

    const result: any = await hook({ data, req } as any)

    expect(result).toBe(data)
    expect(generateAltText).not.toHaveBeenCalled()
  })

  it('does not skip when the field is whitespace-only', async () => {
    const hook = generateAltTextHook(baseOptions)
    const req = makeReq()
    const data = { alt: '   ' }

    await hook({ data, req } as any)

    expect(generateAltText).toHaveBeenCalledTimes(1)
  })

  it('skips when there is no req.file', async () => {
    const hook = generateAltTextHook(baseOptions)
    const req = makeReq({ file: undefined })
    const data = {}

    const result: any = await hook({ data, req } as any)

    expect(result).toBe(data)
    expect(generateAltText).not.toHaveBeenCalled()
  })

  it('skips when the mimetype is unsupported', async () => {
    const hook = generateAltTextHook(baseOptions)
    const req = makeReq({ file: { data: Buffer.from('x'), name: 'f.bmp', mimetype: 'image/bmp' } })
    const data = {}

    const result: any = await hook({ data, req } as any)

    expect(result).toBe(data)
    expect(generateAltText).not.toHaveBeenCalled()
  })

  describe('missing API key', () => {
    const optionsNoKey: ResolvedAltTextOptions = { ...baseOptions, apiKey: undefined }

    beforeEach(() => {
      delete process.env.GEMINI_API_KEY
    })

    it('onError=filename falls back to humanized filename', async () => {
      const hook = generateAltTextHook({ ...optionsNoKey, onError: 'filename' })
      const req = makeReq()
      const data = { filename: 'my-photo.jpg' }

      const result: any = await hook({ data, req } as any)

      expect(generateAltText).not.toHaveBeenCalled()
      expect(result.alt).toBe('My photo')
    })

    it('onError=empty leaves data untouched', async () => {
      const hook = generateAltTextHook({ ...optionsNoKey, onError: 'empty' })
      const req = makeReq()
      const data = { filename: 'my-photo.jpg' }

      const result: any = await hook({ data, req } as any)

      expect(result).toBe(data)
    })

    it('onError=throw rejects', async () => {
      const hook = generateAltTextHook({ ...optionsNoKey, onError: 'throw' })
      const req = makeReq()
      const data = { filename: 'my-photo.jpg' }

      await expect(hook({ data, req } as any)).rejects.toBeTruthy()
    })
  })

  describe('provider throws an AltTextError', () => {
    beforeEach(() => {
      vi.mocked(generateAltText).mockRejectedValue(
        new AltTextError('rate_limited', 'too many requests'),
      )
    })

    it('onError=filename falls back to humanized filename', async () => {
      const hook = generateAltTextHook({ ...baseOptions, onError: 'filename' })
      const req = makeReq()
      const data = { filename: 'my-photo.jpg' }

      const result: any = await hook({ data, req } as any)

      expect(result.alt).toBe('My photo')
    })

    it('onError=empty leaves data untouched', async () => {
      const hook = generateAltTextHook({ ...baseOptions, onError: 'empty' })
      const req = makeReq()
      const data = { filename: 'my-photo.jpg' }

      const result: any = await hook({ data, req } as any)

      expect(result).toBe(data)
    })

    it('onError=throw rejects', async () => {
      const hook = generateAltTextHook({ ...baseOptions, onError: 'throw' })
      const req = makeReq()
      const data = { filename: 'my-photo.jpg' }

      await expect(hook({ data, req } as any)).rejects.toBeInstanceOf(AltTextError)
    })
  })

  it('falls to the onError path when sanitized text is empty', async () => {
    vi.mocked(sanitizeAltText).mockReturnValue('')
    const hook = generateAltTextHook({ ...baseOptions, onError: 'filename' })
    const req = makeReq()
    const data = { filename: 'my-photo.jpg' }

    const result: any = await hook({ data, req } as any)

    expect(result.alt).toBe('My photo')
  })

  it('leaves the field as-is when humanizeFilename also returns empty', async () => {
    vi.mocked(sanitizeAltText).mockReturnValue('')
    vi.mocked(humanizeFilename).mockReturnValue('')
    const hook = generateAltTextHook({ ...baseOptions, onError: 'filename' })
    const req = makeReq()
    const data = { filename: 'my-photo.jpg' }

    const result: any = await hook({ data, req } as any)

    expect(result).toBe(data)
  })

  it('does not crash when req.payload.logger is missing on the failure path', async () => {
    vi.mocked(generateAltText).mockRejectedValue(new AltTextError('server_error', 'boom'))
    const hook = generateAltTextHook({ ...baseOptions, onError: 'filename' })
    const req = makeReq({ payload: undefined })
    const data = { filename: 'my-photo.jpg' }

    const result: any = await hook({ data, req } as any)

    expect(result.alt).toBe('My photo')
  })
})
