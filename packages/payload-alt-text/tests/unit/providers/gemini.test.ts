import { afterEach, describe, expect, test, vi } from 'vitest'

import { generateAltText } from '../../../src/providers/gemini.js'
import { AltTextError } from '../../../src/types.js'

const API_KEY = 'super-secret-key-12345'

const baseArgs = {
  apiKey: API_KEY,
  base64: 'ZmFrZS1pbWFnZS1kYXRh',
  maxLength: 125,
  mimeType: 'image/jpeg',
  model: 'gemini-3.1-flash-lite',
  prompt: 'Describe this image for alt text.',
  timeoutMs: 15000,
}

const okResponse = (texts: string[]) => ({
  json: async () => ({
    candidates: [
      {
        content: {
          parts: texts.map((text) => ({ text })),
        },
      },
    ],
  }),
  ok: true,
  status: 200,
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('generateAltText — request shape', () => {
  test('sends model in URL, key in header only, and correct body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(['a cat on a windowsill']))
    vi.stubGlobal('fetch', fetchMock)

    await generateAltText(baseArgs)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]

    expect(url).toContain(baseArgs.model)
    expect(url).toContain(':generateContent')
    expect(url).not.toContain(API_KEY)

    expect(init.headers['x-goog-api-key']).toBe(API_KEY)
    expect(init.headers['Content-Type']).toBe('application/json')

    const body = JSON.parse(init.body)
    expect(body).toEqual({
      contents: [
        {
          parts: [
            {
              inline_data: {
                data: baseArgs.base64,
                mime_type: baseArgs.mimeType,
              },
            },
            { text: baseArgs.prompt },
          ],
        },
      ],
      generationConfig: { maxOutputTokens: 100, temperature: 0.2 },
    })
  })
})

describe('generateAltText — happy path', () => {
  test('returns text from a single part', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(['a red bicycle'])))
    const result = await generateAltText(baseArgs)
    expect(result).toBe('a red bicycle')
  })

  test('concatenates multiple parts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(['a red ', 'bicycle'])))
    const result = await generateAltText(baseArgs)
    expect(result).toBe('a red bicycle')
  })
})

describe('generateAltText — invalid key', () => {
  test('throws invalid_key without calling fetch when key is empty', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(generateAltText({ ...baseArgs, apiKey: '' })).rejects.toMatchObject({
      code: 'invalid_key',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('throws invalid_key without calling fetch when key is whitespace', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(generateAltText({ ...baseArgs, apiKey: '   ' })).rejects.toMatchObject({
      code: 'invalid_key',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('generateAltText — status mapping', () => {
  const cases: Array<[number, string]> = [
    [400, 'bad_request'],
    [401, 'invalid_key'],
    [403, 'invalid_key'],
    [429, 'rate_limited'],
    [500, 'server_error'],
    [418, 'unknown'],
  ]

  for (const [status, code] of cases) {
    test(`maps ${status} to ${code}`, async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          json: async () => ({ error: { message: 'boom' } }),
          ok: false,
          status,
        }),
      )

      const err = await generateAltText(baseArgs).catch((e) => e)
      expect(err).toBeInstanceOf(AltTextError)
      expect(err.code).toBe(code)
      expect(err.status).toBe(status)
    })
  }

  test('extracts Gemini error message from JSON error body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ error: { message: 'API key not valid' } }),
        ok: false,
        status: 401,
      }),
    )

    const err = await generateAltText(baseArgs).catch((e) => e)
    expect(err.message).toBe('API key not valid')
  })

  test('handles non-JSON error body without throwing a secondary error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => {
          throw new Error('not json')
        },
        ok: false,
        status: 500,
      }),
    )

    const err = await generateAltText(baseArgs).catch((e) => e)
    expect(err).toBeInstanceOf(AltTextError)
    expect(err.code).toBe('server_error')
  })
})

describe('generateAltText — no content', () => {
  test('throws no_content when there are no candidates', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ candidates: [] }),
        ok: true,
        status: 200,
      }),
    )
    await expect(generateAltText(baseArgs)).rejects.toMatchObject({ code: 'no_content' })
  })

  test('throws no_content when parts are empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ candidates: [{ content: { parts: [] } }] }),
        ok: true,
        status: 200,
      }),
    )
    await expect(generateAltText(baseArgs)).rejects.toMatchObject({ code: 'no_content' })
  })

  test('throws no_content when text is whitespace only', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(['   '])))
    await expect(generateAltText(baseArgs)).rejects.toMatchObject({ code: 'no_content' })
  })

  test('throws no_content on promptFeedback.blockReason', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ promptFeedback: { blockReason: 'SAFETY' } }),
        ok: true,
        status: 200,
      }),
    )
    await expect(generateAltText(baseArgs)).rejects.toMatchObject({ code: 'no_content' })
  })

  test('throws no_content on candidate finishReason SAFETY', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'x' }] }, finishReason: 'SAFETY' }],
        }),
        ok: true,
        status: 200,
      }),
    )
    await expect(generateAltText(baseArgs)).rejects.toMatchObject({ code: 'no_content' })
  })
})

describe('generateAltText — network failures', () => {
  test('maps AbortError to timeout', async () => {
    const abortError = new Error('aborted')
    abortError.name = 'AbortError'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError))

    await expect(generateAltText(baseArgs)).rejects.toMatchObject({ code: 'timeout' })
  })

  test('maps a plain network rejection to server_error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    await expect(generateAltText(baseArgs)).rejects.toMatchObject({ code: 'server_error' })
  })
})

describe('generateAltText — key leakage', () => {
  test('invalid_key message for a missing key never contains the api key', async () => {
    const err = await generateAltText({ ...baseArgs, apiKey: '' }).catch((e) => e)
    expect(err.message).not.toContain(API_KEY)
  })

  test('timeout message never contains the api key', async () => {
    const abortError = new Error('aborted')
    abortError.name = 'AbortError'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError))

    const err = await generateAltText(baseArgs).catch((e) => e)
    expect(err.message).not.toContain(API_KEY)
  })

  test('server_error message never contains the api key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    const err = await generateAltText(baseArgs).catch((e) => e)
    expect(err.message).not.toContain(API_KEY)
  })
})
