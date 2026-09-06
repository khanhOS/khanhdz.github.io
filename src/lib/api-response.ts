import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

const PROD = process.env.NODE_ENV === 'production'

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function fail(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...(extra || {}) }, { status })
}

export function failValidation(error: ZodError) {
  const first = error.issues[0]
  return fail(400, first?.message || 'Dữ liệu không hợp lệ', {
    issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
  })
}

export function withErrors<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response>
): (...args: TArgs) => Promise<Response> {
  return (...args: TArgs) =>
    handler(...args).catch((err: unknown) => {
      const e = err as { statusCode?: number; message?: string }
      const status = e?.statusCode || 500
      if (status >= 500) console.error('[api] Internal error:', err)
      if (status === 401) return fail(401, 'Vui lòng đăng nhập để tiếp tục')
      if (status === 403) return fail(403, 'Bạn không có quyền thực hiện hành động này')
      if (status === 429) return fail(429, 'Bạn đang gửi yêu cầu quá nhanh, vui lòng thử lại sau')
      if (e?.message && status < 500) return fail(status, e.message)
      return fail(500, PROD ? 'Lỗi máy chủ nội bộ' : `Lỗi: ${e?.message || 'unknown'}`)
    })
}

export function httpError(status: number, message: string): Error {
  const err = new Error(message)
  ;(err as any).statusCode = status
  return err
}
