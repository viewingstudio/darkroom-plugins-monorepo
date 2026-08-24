import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ResolvedAltTextOptions } from '../../../src/types.js'

import { generateAltText as generateAltTextAnthropic } from '../../../src/providers/anthropic.js'
import { generateAltText } from '../../../src/providers/gemini.js'
import { humanizeFilename } from '../../../src/utilities/humanizeFilename.js'
import { generateAltTextHook } from '../../../src/hooks/generateAltText.js'

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
    vi.mocked(humanizeFilename).mockReturnValue('My photo')
  })

  /**
   * The load-bearing guarantee. Generating here would hold the request's database transaction
   * open for the length of a vision API call, which is what exhausted the connection pooler.
   * Generation belongs to the endpoints; this hook only guarantees the field is non-empty.
   */
  it('never calls a provider', () => {
    const hook = generateAltTextHook(baseOptions)

    hook({ data: { filename: 'my-photo.jpg' }, req: makeReq() } as any)

    expect(generateAltText).not.toHaveBeenCalled()
    expect(generateAltTextAnthropic).not.toHaveBeenCalled()
  })

  it('is synchronous, so it adds no latency to the upload request', () => {
    const hook = generateAltTextHook(baseOptions)

    const result = hook({ data: { filename: 'my-photo.jpg' }, req: makeReq() } as any)

    expect(result).not.toBeInstanceOf(Promise)
  })

  it('fills the field from the uploaded filename when empty', () => {
    const hook = generateAltTextHook(baseOptions)

    const result: any = hook({ data: { filename: 'my-photo.jpg' }, req: makeReq() } as any)

    expect(result.alt).toBe('My photo')
    expect(humanizeFilename).toHaveBeenCalledWith('my-photo.jpg')
  })

  it('honours a custom altFieldName', () => {
    const hook = generateAltTextHook({ ...baseOptions, altFieldName: 'altText' })

    const result: any = hook({ data: { filename: 'my-photo.jpg' }, req: makeReq() } as any)

    expect(result.altText).toBe('My photo')
    expect(result.alt).toBeUndefined()
  })

  it('falls back to data.filename when the request carries no file', () => {
    const hook = generateAltTextHook(baseOptions)

    const result: any = hook({
      data: { filename: 'from-data.jpg' },
      req: makeReq({ file: undefined }),
    } as any)

    expect(result.alt).toBe('My photo')
    expect(humanizeFilename).toHaveBeenCalledWith('from-data.jpg')
  })

  describe('leaves data untouched', () => {
    it('when autoGenerate is off', () => {
      const hook = generateAltTextHook({ ...baseOptions, autoGenerate: false })
      const data = { filename: 'my-photo.jpg' }

      expect(hook({ data, req: makeReq() } as any)).toBe(data)
      expect(humanizeFilename).not.toHaveBeenCalled()
    })

    it('when there is no data', () => {
      const hook = generateAltTextHook(baseOptions)

      expect(hook({ data: undefined, req: makeReq() } as any)).toBeUndefined()
    })

    // Editors generate before saving now, so by the time this hook runs the value is usually
    // already there. Overwriting it would discard their work.
    it('when the field already has a value', () => {
      const hook = generateAltTextHook(baseOptions)
      const data = { alt: 'Already written', filename: 'my-photo.jpg' }

      expect(hook({ data, req: makeReq() } as any)).toBe(data)
      expect(humanizeFilename).not.toHaveBeenCalled()
    })

    it('when the existing value is only whitespace, it is replaced', () => {
      const hook = generateAltTextHook(baseOptions)

      const result: any = hook({
        data: { alt: '   ', filename: 'my-photo.jpg' },
        req: makeReq(),
      } as any)

      expect(result.alt).toBe('My photo')
    })

    it('when onError is empty, so validation decides', () => {
      const hook = generateAltTextHook({ ...baseOptions, onError: 'empty' })
      const data = { filename: 'my-photo.jpg' }

      expect(hook({ data, req: makeReq() } as any)).toBe(data)
      expect(humanizeFilename).not.toHaveBeenCalled()
    })

    it('when the filename yields no usable fallback', () => {
      vi.mocked(humanizeFilename).mockReturnValue('')
      const hook = generateAltTextHook(baseOptions)
      const data = { filename: '.jpg' }

      expect(hook({ data, req: makeReq() } as any)).toBe(data)
    })
  })
})
