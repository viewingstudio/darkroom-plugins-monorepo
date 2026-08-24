import { afterEach, describe, expect, test, vi } from 'vitest'

import { generateAltText } from '../../../src/providers/anthropic.js'
import { AltTextError } from '../../../src/types.js'

const API_KEY = 'sk-ant-super-secret-key-12345'

const baseArgs = {
  apiKey: API_KEY,
  base64: 'ZmFrZS1pbWFnZS1kYXRh',
  maxLength: 125,
  mimeType: 'image/jpeg',
  model: 'claude-haiku-4-5-20251001',
  prompt: 'Describe this image for alt text.',
  timeoutMs: 15000,
}

const okResponse = (blocks: Array<{ text?: string; type?: string }>) => ({
  json: async () => ({ content: blocks }),
  ok: true,
  status: 200,
})

const textResponse = (...texts: string[]) =>
  okResponse(texts.map((text) => ({ text, type: 'text' })))

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('generateAltText — request shape', () => {
  test('posts to the messages endpoint with the key in a header only', async () => {
    const fetchMock = vi.fn().mockResolvedValue(textResponse('a cat on a windowsill'))
    vi.stubGlobal('fetch', fetchMock)

    await generateAltText(baseArgs)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]

    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect(url).not.toContain(API_KEY)

    expect(init.method).toBe('POST')
    expect(init.headers['x-api-key']).toBe(API_KEY)
    expect(init.headers['anthropic-version']).toBe('2023-06-01')
    expect(init.headers['Content-Type']).toBe('application/json')
  })

  test('sends the image before the prompt in a single user message', async () => {
    const fetchMock = vi.fn().mockResolvedValue(textResponse('a red bicycle'))
    vi.stubGlobal('fetch', fetchMock)

    await generateAltText(baseArgs)

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toEqual({
      max_tokens: 100,
      messages: [
        {
          content: [
            {
              source: { data: baseArgs.base64, media_type: baseArgs.mimeType, type: 'base64' },
              type: 'image',
            },
            { text: baseArgs.prompt, type: 'text' },
          ],
          role: 'user',
        },
      ],
      model: baseArgs.model,
      temperature: 0.2,
    })
  })

  test('passes the model through verbatim', async () => {
    const fetchMock = vi.fn().mockResolvedValue(textResponse('x'))
    vi.stubGlobal('fetch', fetchMock)

    await generateAltText({ ...baseArgs, model: 'claude-sonnet-5' })

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe('claude-sonnet-5')
  })
})

describe('generateAltText — happy path', () => {
  test('returns text from a single block', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(textResponse('a red bicycle')))
    expect(await generateAltText(baseArgs)).toBe('a red bicycle')
  })

  test('concatenates multiple text blocks', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(textResponse('a red ', 'bicycle')))
    expect(await generateAltText(baseArgs)).toBe('a red bicycle')
  })

  test('ignores non-text blocks such as thinking', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        okResponse([
          { text: 'deliberating', type: 'thinking' },
          { text: 'a red bicycle', type: 'text' },
        ]),
      ),
    )
    expect(await generateAltText(baseArgs)).toBe('a red bicycle')
  })

  test('accepts a max_tokens stop_reason as a usable result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          content: [{ text: 'a red bicycle leaning against a', type: 'text' }],
          stop_reason: 'max_tokens',
        }),
        ok: true,
        status: 200,
      }),
    )
    expect(await generateAltText(baseArgs)).toBe('a red bicycle leaning against a')
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
    [404, 'bad_request'],
    [413, 'bad_request'],
    [429, 'rate_limited'],
    [500, 'server_error'],
    // Anthropic's overloaded_error — a retryable server condition, not a client mistake.
    [529, 'server_error'],
    [418, 'unknown'],
  ]

  for (const [status, code] of cases) {
    test(`maps ${status} to ${code}`, async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          json: async () => ({ error: { message: 'boom', type: 'error' } }),
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

  test('extracts the Anthropic error message from a JSON error body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          error: { message: 'invalid x-api-key', type: 'authentication_error' },
          type: 'error',
        }),
        ok: false,
        status: 401,
      }),
    )

    const err = await generateAltText(baseArgs).catch((e) => e)
    expect(err.message).toBe('invalid x-api-key')
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
  test('throws no_content when content is absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: async () => ({}), ok: true, status: 200 }),
    )
    await expect(generateAltText(baseArgs)).rejects.toMatchObject({ code: 'no_content' })
  })

  test('throws no_content when content is an empty array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse([])))
    await expect(generateAltText(baseArgs)).rejects.toMatchObject({ code: 'no_content' })
  })

  test('throws no_content when text is whitespace only', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(textResponse('   ')))
    await expect(generateAltText(baseArgs)).rejects.toMatchObject({ code: 'no_content' })
  })

  test('throws no_content when only non-text blocks come back', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(okResponse([{ text: 'hmm', type: 'thinking' }])),
    )
    await expect(generateAltText(baseArgs)).rejects.toMatchObject({ code: 'no_content' })
  })

  test('throws no_content on a refusal stop_reason', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          content: [{ text: 'I cannot describe this.', type: 'text' }],
          stop_reason: 'refusal',
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
