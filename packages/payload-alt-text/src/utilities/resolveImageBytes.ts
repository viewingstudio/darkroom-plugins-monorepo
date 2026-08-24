import { DEFAULT_TIMEOUT_MS, MAX_IMAGE_BYTES, SUPPORTED_MIME_TYPES } from '../defaults.js'
import { AltTextError } from '../types.js'
import type { ResolvedImage } from '../types.js'

type ImageSource = {
  filename?: string
  mimeType?: string
  url?: string
}

type ResolveImageBytesArgs = {
  doc: Record<string, any>
  serverURL?: string
  sizeName?: string
  timeoutMs?: number
}

/** Pure selection logic, kept separate from I/O so it can be unit tested without a network stub. */
export function pickImageSource(
  doc: Record<string, any>,
  sizeName?: string,
): ImageSource | undefined {
  const sizes = doc?.sizes && typeof doc.sizes === 'object' ? doc.sizes : undefined

  if (sizeName && sizes?.[sizeName]?.url) {
    const named = sizes[sizeName]
    return { filename: named.filename, mimeType: named.mimeType, url: named.url }
  }

  if (sizes) {
    let smallest: ImageSource | undefined
    let smallestSize = Infinity

    for (const size of Object.values(sizes) as any[]) {
      if (!size?.url || typeof size.filesize !== 'number' || size.filesize <= 0) {
        continue
      }
      if (size.filesize < smallestSize) {
        smallestSize = size.filesize
        smallest = { filename: size.filename, mimeType: size.mimeType, url: size.url }
      }
    }

    if (smallest) {
      return smallest
    }
  }

  if (doc?.url) {
    return { filename: doc.filename, mimeType: doc.mimeType, url: doc.url }
  }

  return undefined
}

function resolveAbsoluteUrl(url: string, serverURL?: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url
  }

  if (!serverURL) {
    throw new AltTextError(
      'bad_request',
      'serverURL must be configured to resolve relative media URLs',
    )
  }

  const base = serverURL.replace(/\/+$/, '')
  const path = url.startsWith('/') ? url : `/${url}`
  return `${base}${path}`
}

function normalizeMimeType(contentType: string | null | undefined): string | undefined {
  if (!contentType) {
    return undefined
  }
  return contentType.split(';')[0]?.trim() || undefined
}

export async function resolveImageBytes({
  doc,
  serverURL,
  sizeName,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: ResolveImageBytesArgs): Promise<ResolvedImage> {
  const source = pickImageSource(doc, sizeName)

  if (!source?.url) {
    throw new AltTextError('bad_request', 'No usable image URL found on the document')
  }

  const absoluteUrl = resolveAbsoluteUrl(source.url, serverURL)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let response: Response

  try {
    response = await fetch(absoluteUrl, { signal: controller.signal })
    clearTimeout(timeoutId)
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      throw new AltTextError('timeout', `Timed out fetching image after ${timeoutMs}ms`)
    }

    throw error
  }

  if (!response.ok) {
    const code = response.status >= 500 ? 'server_error' : 'bad_request'
    throw new AltTextError(
      code,
      `Failed to fetch image (${response.status} ${response.statusText})`,
      response.status,
    )
  }

  const mimeType = normalizeMimeType(response.headers.get('content-type')) ?? source.mimeType

  if (!mimeType || !SUPPORTED_MIME_TYPES.includes(mimeType)) {
    throw new AltTextError('bad_request', `Unsupported image mime type: ${mimeType ?? 'unknown'}`)
  }

  const contentLength = response.headers.get('content-length')
  if (contentLength && Number(contentLength) > MAX_IMAGE_BYTES) {
    throw new AltTextError('bad_request', `Image exceeds the ${MAX_IMAGE_BYTES} byte limit`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const bytes = Buffer.from(arrayBuffer)

  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new AltTextError('bad_request', `Image exceeds the ${MAX_IMAGE_BYTES} byte limit`)
  }

  const base64 = bytes.toString('base64')

  return { base64, mimeType }
}
