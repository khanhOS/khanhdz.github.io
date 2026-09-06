// KhanhOS AI — Simple in-memory rate limiter
interface RateBucket { count: number; resetAt: number }
const buckets = new Map<string, RateBucket>()

interface RateLimitOptions {
  key: string
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(opts.key)
  if (!existing || existing.resetAt < now) {
    buckets.set(opts.key, { count: 1, resetAt: now + opts.windowMs })
    return { ok: true, remaining: opts.limit - 1, resetAt: now + opts.windowMs }
  }
  if (existing.count >= opts.limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt }
  }
  existing.count += 1
  return { ok: true, remaining: opts.limit - existing.count, resetAt: existing.resetAt }
}

export function getClientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
  const ua = request.headers.get('user-agent') || ''
  return `${ip}::${ua.slice(0, 50)}`
}

export function authRateLimit(request: Request, action: string): RateLimitResult {
  const ip = getClientId(request).split('::')[0]
  return rateLimit({ key: `auth:${action}:${ip}`, limit: 5, windowMs: 60_000 })
}

export function chatRateLimit(request: Request, userId?: string): RateLimitResult {
  const ip = getClientId(request).split('::')[0]
  const key = userId ? `chat:user:${userId}` : `chat:ip:${ip}`
  return rateLimit({ key, limit: 20, windowMs: 60_000 })
}
