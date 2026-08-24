import type { ResolvedImage } from '../types.js'

/**
 * Longest edge, in px, of the image sent for description. Gemini bills any image at or under
 * 384px as a flat 258 input tokens, and a description needs far less detail than a person
 * looking at the picture — but overshooting the flat tier slightly costs little and keeps small
 * text in screenshots legible.
 */
const MAX_EDGE = 768

/** Quality for the re-encoded JPEG. Alt text does not benefit from more. */
const QUALITY = 0.8

const OUTPUT_MIME = 'image/jpeg'

const readAsDataURL = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the selected file'))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(blob)
  })

const stripDataURLPrefix = (dataURL: string): string => dataURL.slice(dataURL.indexOf(',') + 1)

/**
 * Downscales and re-encodes the pending upload in the browser before it is sent for
 * description.
 *
 * This is what keeps pre-save generation viable on a serverless host: the original file can be
 * many megabytes, and base64 inflates it by a third, which would run into the platform's
 * request body limit (4.5MB on Vercel). A 768px JPEG is typically 50-150KB. It also cuts the
 * provider's input tokens and the upload time.
 *
 * Falls back to the untouched file when the browser cannot decode it — an unsupported or
 * corrupt image is the server's error to report, not something to swallow here.
 */
export const downscaleInBrowser = async (file: File): Promise<ResolvedImage> => {
  const passthrough = async (): Promise<ResolvedImage> => ({
    base64: stripDataURLPrefix(await readAsDataURL(file)),
    mimeType: file.type,
  })

  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') {
    return passthrough()
  }

  let bitmap: ImageBitmap

  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return passthrough()
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))

    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')

    if (!context) {
      return passthrough()
    }

    // Flatten onto white: JPEG has no alpha, and the default is black, which reads as a very
    // different picture to a vision model.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(bitmap, 0, 0, width, height)

    return {
      base64: stripDataURLPrefix(canvas.toDataURL(OUTPUT_MIME, QUALITY)),
      mimeType: OUTPUT_MIME,
    }
  } finally {
    bitmap.close()
  }
}
