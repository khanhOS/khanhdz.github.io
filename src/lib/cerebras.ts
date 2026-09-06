// KhanhOS AI — Cerebras API client (SERVER-ONLY)
// The API key NEVER leaves this file's call path.

const CEREBRAS_BASE_URL = 'https://api.cerebras.ai/v1'

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
    super(message); this.status = status; this.name = 'CerebrasError'
  }
}

function getApiKey(): string {
  const key = process.env.CEREBRAS_API_KEY
  if (!key || key.startsWith('csk-xxx') || key.length < 10) {
    throw new CerebrasError('Cerebras API key not configured. Set CEREBRAS_API_KEY in .env', 503)
  }
  return key
}

export function getCerebrasModel(): string {
  return process.env.CEREBRAS_MODEL || 'llama3.1-8b'
}

export async function* streamCerebrasChat(
  options: CerebrasStreamOptions
): AsyncGenerator<string, { inputTokens: number; outputTokens: number }, void> {
  const apiKey = getApiKey()
  const model = options.model || getCerebrasModel()

  const response = await fetch(`${CEREBRAS_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      stream: true,
      stream_options: { include_usage: true },
    }),
    signal: AbortSignal.timeout(60_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    if (response.status === 403 && text.includes('Cloudflare')) {
      throw new CerebrasError(
        'Cerebras API bị Cloudflare block từ IP này. Key hợp lệ nhưng sandbox không gọi được tới Cerebras. Deploy lên Vercel sẽ hoạt động bình thường.',
        403
      )
    }
    throw new CerebrasError(
      `Cerebras API error ${response.status}: ${text.slice(0, 300)}`,
      response.status
    )
  }
  if (!response.body) {
    throw new CerebrasError('No response body from Cerebras', 502)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let totalOutput = ''
  let inputTokens = 0
  let outputTokens = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue
      try {
        const json = JSON.parse(data)
        const delta = json.choices?.[0]?.delta?.content
        if (typeof delta === 'string' && delta.length > 0) {
          totalOutput += delta
          yield delta
        }
        if (json.usage) {
          inputTokens = json.usage.prompt_tokens ?? inputTokens
          outputTokens = json.usage.completion_tokens ?? outputTokens
        }
      } catch { /* skip malformed */ }
    }
  }

  if (inputTokens === 0) inputTokens = estimateTokens(options.messages.map((m) => m.content).join('\n'))
  if (outputTokens === 0) outputTokens = estimateTokens(totalOutput)

  return { inputTokens, outputTokens }
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4))
}

export async function completeCerebrasChat(
  options: CerebrasStreamOptions
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const apiKey = getApiKey()
  const model = options.model || getCerebrasModel()

  const response = await fetch(`${CEREBRAS_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      stream: false,
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    if (response.status === 403 && text.includes('Cloudflare')) {
      throw new CerebrasError(
        'Cerebras API bị Cloudflare block từ sandbox. Deploy lên Vercel sẽ hoạt động.',
        403
      )
    }
    throw new CerebrasError(
      `Cerebras API error ${response.status}: ${text.slice(0, 300)}`,
      response.status
    )
  }

  const json = await response.json()
  const content = json.choices?.[0]?.message?.content ?? ''
  return {
    content,
    inputTokens: json.usage?.prompt_tokens ?? estimateTokens(options.messages.map((m) => m.content).join('\n')),
    outputTokens: json.usage?.completion_tokens ?? estimateTokens(content),
  }
}
