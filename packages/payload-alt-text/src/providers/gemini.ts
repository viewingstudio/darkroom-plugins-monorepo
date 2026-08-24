import type { GenerateAltTextArgs } from '../types.js'

import { GEMINI_API_BASE, MAX_OUTPUT_TOKENS } from '../defaults.js'
import { AltTextError } from '../types.js'

const SAFETY_BLOCK_REASONS = ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST']

type GeminiPart = { text?: string }

type GeminiCandidate = {
  content?: { parts?: GeminiPart[] }
  finishReason?: string
}

type GeminiResponse = {
  candidates?: GeminiCandidate[]
  promptFeedback?: { blockReason?: string }
}

const statusToCode = (status: number) => {
  if (status === 400) return 'bad_request' as const
  if (status === 401 || status === 403) return 'invalid_key' as const
  if (status === 429) return 'rate_limited' as const
  if (status >= 500) return 'server_error' as const
  return 'unknown' as const
}

const extractErrorMessage = async (response: Response, fallback: string) => {
  try {
    const body = await response.json()
    const message = body?.error?.message
    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  } catch {
    // Non-JSON error body — fall back to the generic message.
  }
  return fallback
}

export async function generateAltText(args: GenerateAltTextArgs): Promise<string> {
  const { apiKey, base64, mimeType, model, prompt, timeoutMs } = args

  if (!apiKey || apiKey.trim().length === 0) {
    throw new AltTextError('invalid_key', 'Gemini API key is missing')
  }

  const url = `${GEMINI_API_BASE}/${model}:generateContent`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ inline_data: { data: base64, mime_type: mimeType } }, { text: prompt }],
          },
        ],
        generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.2 },
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AltTextError('timeout', 'Gemini request timed out')
    }
    throw new AltTextError('server_error', 'Failed to reach Gemini API')
  }

  if (!response.ok) {
    const code = statusToCode(response.status)
    const message = await extractErrorMessage(response, `Gemini API request failed`)
    throw new AltTextError(code, message, response.status)
  }

  const data = (await response.json()) as GeminiResponse

  if (data.promptFeedback?.blockReason) {
    throw new AltTextError(
      'no_content',
      `Gemini blocked the request: ${data.promptFeedback.blockReason}`,
    )
  }

  const candidate = data.candidates?.[0]

  if (!candidate) {
    throw new AltTextError('no_content', 'Gemini returned no candidates')
  }

  if (candidate.finishReason && SAFETY_BLOCK_REASONS.includes(candidate.finishReason)) {
    throw new AltTextError('no_content', `Gemini blocked the response: ${candidate.finishReason}`)
  }

  const parts = candidate.content?.parts ?? []
  const text = parts
    .map((part) => part.text)
    .filter((text): text is string => typeof text === 'string')
    .join('')

  if (text.trim().length === 0) {
    throw new AltTextError('no_content', 'Gemini returned no text content')
  }

  return text
}
