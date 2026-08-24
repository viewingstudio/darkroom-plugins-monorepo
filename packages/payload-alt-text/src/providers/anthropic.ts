import type { GenerateAltTextArgs } from '../types.js'

import { ANTHROPIC_API_URL, ANTHROPIC_VERSION, MAX_OUTPUT_TOKENS } from '../defaults.js'
import { AltTextError } from '../types.js'

type AnthropicContentBlock = { text?: string; type?: string }

type AnthropicResponse = {
  content?: AnthropicContentBlock[]
  stop_reason?: string
}

const statusToCode = (status: number) => {
  if (status === 400 || status === 404 || status === 413) return 'bad_request' as const
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
    throw new AltTextError('invalid_key', 'Anthropic API key is missing')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let response: Response
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'anthropic-version': ANTHROPIC_VERSION,
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          {
            content: [
              {
                source: { data: base64, media_type: mimeType, type: 'base64' },
                type: 'image',
              },
              { text: prompt, type: 'text' },
            ],
            role: 'user',
          },
        ],
        model,
        temperature: 0.2,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AltTextError('timeout', 'Anthropic request timed out')
    }
    throw new AltTextError('server_error', 'Failed to reach Anthropic API')
  }

  if (!response.ok) {
    const code = statusToCode(response.status)
    const message = await extractErrorMessage(response, `Anthropic API request failed`)
    throw new AltTextError(code, message, response.status)
  }

  const data = (await response.json()) as AnthropicResponse

  // `max_tokens` is not a failure — the sanitizer truncates on a word boundary anyway.
  if (data.stop_reason === 'refusal') {
    throw new AltTextError('no_content', 'Anthropic declined to describe this image')
  }

  // Ignore any thinking/tool blocks a future model might interleave; only text is alt text.
  const text = (data.content ?? [])
    .filter((block) => block?.type === 'text')
    .map((block) => block.text)
    .filter((value): value is string => typeof value === 'string')
    .join('')

  if (text.trim().length === 0) {
    throw new AltTextError('no_content', 'Anthropic returned no text content')
  }

  return text
}
