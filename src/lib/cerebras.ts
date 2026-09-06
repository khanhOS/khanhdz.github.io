const CEREBRAS_BASE_URL = 'https://api.cerebras.ai/v1'

export function getCerebrasModel() {
  return process.env.CEREBRAS_MODEL || 'gpt-oss-120b'
}

function getApiKey() {
  const key = process.env.CEREBRAS_API_KEY?.trim()

  if (!key) {
    throw new Error('CEREBRAS_API_KEY chưa được cấu hình')
  }

  return key
}
