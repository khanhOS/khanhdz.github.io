// KhanhOS AI — Gemini API client (SERVER-ONLY)
// API key NEVER leaves the server.
//
// NOTE:
// File này giữ nguyên tên/export cũ để /api/chat không cần
// thay đổi toàn bộ code gọi provider.

const GEMINI_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta'

const DEFAULT_GEMINI_MODEL = 'gemini-3.7-flash'

export interface CerebrasMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CerebrasStreamOptions {
  model?: string
  messages: CerebrasMessage[]
  temperature?: number
  maxTokens?: number
}

export class CerebrasError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'CerebrasError'
  }
}

/**
 * Gemini API key.
 *
 * Set this on Vercel:
 * GEMINI_API_KEY=...
 */
function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim()

  if (!key || key.length < 10) {
    throw new CerebrasError(
      'Gemini API key not configured. Set GEMINI_API_KEY in Vercel Environment Variables.',
      503
    )
  }

  return key
}

/**
 * Gemini model.
 *
 * Optional Vercel environment variable:
 * GEMINI_MODEL
 *
 * Default:
 * gemini-3.7-flash
 */
export function getCerebrasModel(): string {
  return (
    process.env.GEMINI_MODEL?.trim() ||
    DEFAULT_GEMINI_MODEL
  )
}

/**
 * Convert our internal message format to Gemini format.
 *
 * Gemini:
 * user      -> user
 * assistant -> model
 *
 * system messages are handled separately as systemInstruction.
 */
function convertMessages(
  messages: CerebrasMessage[]
): {
  systemInstruction?: {
    parts: Array<{ text: string }>
  }
  contents: Array<{
    role: 'user' | 'model'
    parts: Array<{ text: string }>
  }>
} {
  const systemMessages = messages.filter(
    (message) => message.role === 'system'
  )

  const normalMessages = messages.filter(
    (message) => message.role !== 'system'
  )

  const contents = normalMessages.map((message) => ({
    role:
      message.role === 'assistant'
        ? ('model' as const)
        : ('user' as const),

    parts: [
      {
        text: message.content,
      },
    ],
  }))

  const systemText = systemMessages
    .map((message) => message.content)
    .join('\n\n')
    .trim()

  return {
    ...(systemText
      ? {
          systemInstruction: {
            parts: [
              {
                text: systemText,
              },
            ],
          },
        }
      : {}),

    contents,
  }
}

/**
 * Parse Gemini usage metadata.
 */
function readUsage(json: any): {
  inputTokens: number
  outputTokens: number
} {
  const usage = json?.usageMetadata

  return {
    inputTokens:
      usage?.promptTokenCount ??
      usage?.inputTokenCount ??
      0,

    outputTokens:
      usage?.candidatesTokenCount ??
      usage?.outputTokenCount ??
      0,
  }
}

/**
 * Extract text from a Gemini response chunk.
 */
function extractText(json: any): string {
  const parts =
    json?.candidates?.[0]?.content?.parts

  if (!Array.isArray(parts)) {
    return ''
  }

  return parts
    .map((part: any) =>
      typeof part?.text === 'string'
        ? part.text
        : ''
    )
    .join('')
}

/**
 * Streaming Gemini chat.
 *
 * Keeps the old function name so /api/chat does not need
 * to be rewritten.
 */
export async function* streamCerebrasChat(
  options: CerebrasStreamOptions
): AsyncGenerator<
  string,
  {
    inputTokens: number
    outputTokens: number
  },
  void
> {
  const apiKey = getApiKey()

  const model =
    options.model?.trim() ||
    getCerebrasModel()

  const converted =
    convertMessages(options.messages)

  const url =
    `${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}` +
    `:streamGenerateContent?alt=sse`

  const response = await fetch(url, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },

    body: JSON.stringify({
      ...(converted.systemInstruction
        ? {
            systemInstruction:
              converted.systemInstruction,
          }
        : {}),

      contents: converted.contents,

      generationConfig: {
        temperature:
          options.temperature ?? 0.7,

        maxOutputTokens:
          options.maxTokens ?? 2048,
      },
    }),

    signal: AbortSignal.timeout(60_000),
  })

  if (!response.ok) {
    const text = await response
      .text()
      .catch(() => '')

    throw new CerebrasError(
      `Gemini API error ${response.status}: ${text.slice(
        0,
        500
      )}`,
      response.status
    )
  }

  if (!response.body) {
    throw new CerebrasError(
      'No response body from Gemini',
      502
    )
  }

  const reader =
    response.body.getReader()

  const decoder =
    new TextDecoder()

  let buffer = ''
  let totalOutput = ''

  let inputTokens = 0
  let outputTokens = 0

  while (true) {
    const { done, value } =
      await reader.read()

    if (done) break

    buffer += decoder.decode(value, {
      stream: true,
    })

    const lines =
      buffer.split('\n')

    buffer =
      lines.pop() || ''

    for (const line of lines) {
      const trimmed =
        line.trim()

      if (!trimmed) {
        continue
      }

      if (!trimmed.startsWith('data:')) {
        continue
      }

      const data =
        trimmed
          .slice(5)
          .trim()

      if (!data) {
        continue
      }

      try {
        const json =
          JSON.parse(data)

        const text =
          extractText(json)

        if (text) {
          totalOutput += text

          yield text
        }

        const usage =
          readUsage(json)

        if (usage.inputTokens > 0) {
          inputTokens =
            usage.inputTokens
        }

        if (usage.outputTokens > 0) {
          outputTokens =
            usage.outputTokens
        }
      } catch {
        // Ignore malformed SSE chunks.
      }
    }
  }

  if (inputTokens === 0) {
    inputTokens =
      estimateTokens(
        options.messages
          .map(
            (message) =>
              message.content
          )
          .join('\n')
      )
  }

  if (outputTokens === 0) {
    outputTokens =
      estimateTokens(totalOutput)
  }

  return {
    inputTokens,
    outputTokens,
  }
}

/**
 * Estimate tokens when the provider doesn't return usage.
 */
export function estimateTokens(
  text: string
): number {
  return Math.max(
    1,
    Math.ceil(text.length / 4)
  )
}

/**
 * Non-streaming Gemini chat.
 *
 * Keeps the old function name so existing imports
 * continue to work.
 */
export async function completeCerebrasChat(
  options: CerebrasStreamOptions
): Promise<{
  content: string
  inputTokens: number
  outputTokens: number
}> {
  const apiKey = getApiKey()

  const model =
    options.model?.trim() ||
    getCerebrasModel()

  const converted =
    convertMessages(options.messages)

  const url =
    `${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}` +
    ':generateContent'

  const response = await fetch(url, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },

    body: JSON.stringify({
      ...(converted.systemInstruction
        ? {
            systemInstruction:
              converted.systemInstruction,
          }
        : {}),

      contents: converted.contents,

      generationConfig: {
        temperature:
          options.temperature ?? 0.7,

        maxOutputTokens:
          options.maxTokens ?? 1024,
      },
    }),

    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    const text = await response
      .text()
      .catch(() => '')

    throw new CerebrasError(
      `Gemini API error ${response.status}: ${text.slice(
        0,
        500
      )}`,
      response.status
    )
  }

  const json =
    await response.json()

  const content =
    extractText(json)

  const usage =
    readUsage(json)

  return {
    content,

    inputTokens:
      usage.inputTokens ||
      estimateTokens(
        options.messages
          .map(
            (message) =>
              message.content
          )
          .join('\n')
      ),

    outputTokens:
      usage.outputTokens ||
      estimateTokens(content),
  }
}
