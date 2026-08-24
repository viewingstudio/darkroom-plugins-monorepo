import { afterEach, describe, expect, test, vi } from 'vitest'

import { AltTextError } from '../../../src/types.js'
import { pickImageSource, resolveImageBytes } from '../../../src/utilities/resolveImageBytes.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

function mockResponse(args: {
  arrayBuffer?: ArrayBuffer
  headers?: Record<string, string>
  ok?: boolean
  status?: number
  statusText?: string
}) {
  const headers = new Map(Object.entries(args.headers ?? {}))
  return {
    ok: args.ok ?? true,
    status: args.status ?? 200,
    statusText: args.statusText ?? 'OK',
    headers: {
      get: (key: string) => headers.get(key.toLowerCase()) ?? null,
    },
    arrayBuffer: async () => args.arrayBuffer ?? new ArrayBuffer(0),
  }
}

describe('pickImageSource', () => {
  test('named size chosen when present with a url', () => {
    const doc = {
      url: '/original.jpg',
      filename: 'original.jpg',
      mimeType: 'image/jpeg',
      sizes: {
        thumbnail: {
          url: '/thumb.jpg',
          filename: 'thumb.jpg',
          mimeType: 'image/jpeg',
          filesize: 500,
        },
        card: { url: '/card.jpg', filename: 'card.jpg', mimeType: 'image/jpeg', filesize: 2000 },
      },
    }

    const result = pickImageSource(doc, 'card')
    expect(result).toEqual({ url: '/card.jpg', filename: 'card.jpg', mimeType: 'image/jpeg' })
  })

  test('named size missing a url falls through to smallest', () => {
    const doc = {
      url: '/original.jpg',
      filename: 'original.jpg',
      mimeType: 'image/jpeg',
      sizes: {
        thumbnail: {
          url: '/thumb.jpg',
          filename: 'thumb.jpg',
          mimeType: 'image/jpeg',
          filesize: 500,
        },
        card: { filesize: 2000 },
      },
    }

    const result = pickImageSource(doc, 'card')
    expect(result?.url).toBe('/thumb.jpg')
  })

  test('smallest-filesize chosen over a larger one', () => {
    const doc = {
      sizes: {
        big: { url: '/big.jpg', filesize: 5000 },
        small: { url: '/small.jpg', filesize: 100 },
        medium: { url: '/medium.jpg', filesize: 1000 },
      },
    }

    const result = pickImageSource(doc)
    expect(result?.url).toBe('/small.jpg')
  })

  test('original used when sizes is absent', () => {
    const doc = { url: '/original.jpg', filename: 'original.jpg', mimeType: 'image/jpeg' }
    const result = pickImageSource(doc)
    expect(result).toEqual({
      url: '/original.jpg',
      filename: 'original.jpg',
      mimeType: 'image/jpeg',
    })
  })

  test('original used when sizes is empty', () => {
    const doc = {
      url: '/original.jpg',
      filename: 'original.jpg',
      mimeType: 'image/jpeg',
      sizes: {},
    }
    const result = pickImageSource(doc)
    expect(result?.url).toBe('/original.jpg')
  })

  test('undefined when no url anywhere', () => {
    const doc = { sizes: { thumbnail: { filesize: 100 } } }
    expect(pickImageSource(doc)).toBeUndefined()
  })
})

describe('resolveImageBytes', () => {
  test('absolute source url used verbatim', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        headers: { 'content-type': 'image/png' },
        arrayBuffer: new Uint8Array([1, 2, 3]).buffer,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const doc = { url: 'https://cdn.example.com/image.png', mimeType: 'image/png' }
    await resolveImageBytes({ doc })

    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example.com/image.png', expect.anything())
  })

  test('relative url joined to serverURL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        headers: { 'content-type': 'image/png' },
        arrayBuffer: new Uint8Array([1]).buffer,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const doc = { url: '/media/image.png', mimeType: 'image/png' }
    await resolveImageBytes({ doc, serverURL: 'https://example.com' })

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/media/image.png', expect.anything())
  })

  test('trailing slash on serverURL and leading slash on path do not double up', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        headers: { 'content-type': 'image/png' },
        arrayBuffer: new Uint8Array([1]).buffer,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const doc = { url: '/media/image.png', mimeType: 'image/png' }
    await resolveImageBytes({ doc, serverURL: 'https://example.com/' })

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/media/image.png', expect.anything())
  })

  test('path without a leading slash still joins cleanly', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        headers: { 'content-type': 'image/png' },
        arrayBuffer: new Uint8Array([1]).buffer,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const doc = { url: 'media/image.png', mimeType: 'image/png' }
    await resolveImageBytes({ doc, serverURL: 'https://example.com/' })

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/media/image.png', expect.anything())
  })

  test('relative url with no serverURL throws bad_request', async () => {
    vi.stubGlobal('fetch', vi.fn())

    const doc = { url: '/media/image.png', mimeType: 'image/png' }

    await expect(resolveImageBytes({ doc })).rejects.toMatchObject({
      code: 'bad_request',
    } satisfies Partial<AltTextError>)
  })

  test('happy path returns correct base64 and mime type from content-type', async () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111])
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        headers: { 'content-type': 'image/webp' },
        arrayBuffer: bytes.buffer,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const doc = { url: 'https://cdn.example.com/image.webp', mimeType: 'image/webp' }
    const result = await resolveImageBytes({ doc })

    expect(result.mimeType).toBe('image/webp')
    expect(result.base64).toBe(Buffer.from(bytes).toString('base64'))
  })

  test('content-type with charset parameter is stripped', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        headers: { 'content-type': 'image/png; charset=binary' },
        arrayBuffer: new Uint8Array([1]).buffer,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const doc = { url: 'https://cdn.example.com/image.png', mimeType: 'image/png' }
    const result = await resolveImageBytes({ doc })

    expect(result.mimeType).toBe('image/png')
  })

  test('unsupported mime type throws bad_request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        headers: { 'content-type': 'image/svg+xml' },
        arrayBuffer: new Uint8Array([1]).buffer,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const doc = { url: 'https://cdn.example.com/image.svg', mimeType: 'image/svg+xml' }

    await expect(resolveImageBytes({ doc })).rejects.toMatchObject({ code: 'bad_request' })
  })

  test('oversize content-length throws without reading the body', async () => {
    const arrayBufferSpy = vi.fn()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {
        get: (key: string) =>
          key.toLowerCase() === 'content-type'
            ? 'image/png'
            : key.toLowerCase() === 'content-length'
              ? String(15 * 1024 * 1024)
              : null,
      },
      arrayBuffer: arrayBufferSpy,
    })
    vi.stubGlobal('fetch', fetchMock)

    const doc = { url: 'https://cdn.example.com/image.png', mimeType: 'image/png' }

    await expect(resolveImageBytes({ doc })).rejects.toMatchObject({ code: 'bad_request' })
    expect(arrayBufferSpy).not.toHaveBeenCalled()
  })

  test('oversize actual body throws bad_request', async () => {
    const oversized = new Uint8Array(15 * 1024 * 1024)
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        headers: { 'content-type': 'image/png' },
        arrayBuffer: oversized.buffer,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const doc = { url: 'https://cdn.example.com/image.png', mimeType: 'image/png' }

    await expect(resolveImageBytes({ doc })).rejects.toMatchObject({ code: 'bad_request' })
  })

  test('404 response maps to bad_request with status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ ok: false, status: 404, statusText: 'Not Found' }))
    vi.stubGlobal('fetch', fetchMock)

    const doc = { url: 'https://cdn.example.com/missing.png', mimeType: 'image/png' }

    await expect(resolveImageBytes({ doc })).rejects.toMatchObject({
      code: 'bad_request',
      status: 404,
    })
  })

  test('500 response maps to server_error', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        mockResponse({ ok: false, status: 500, statusText: 'Internal Server Error' }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const doc = { url: 'https://cdn.example.com/image.png', mimeType: 'image/png' }

    await expect(resolveImageBytes({ doc })).rejects.toMatchObject({
      code: 'server_error',
      status: 500,
    })
  })

  test('AbortError maps to timeout', async () => {
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'
    const fetchMock = vi.fn().mockRejectedValue(abortError)
    vi.stubGlobal('fetch', fetchMock)

    const doc = { url: 'https://cdn.example.com/image.png', mimeType: 'image/png' }

    await expect(resolveImageBytes({ doc })).rejects.toMatchObject({ code: 'timeout' })
  })
})
