import { db } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'
import { resetPasswordSchema } from '@/lib/validation'
import { authRateLimit } from '@/lib/rate-limit'
import { ok, fail, failValidation, withErrors, httpError } from '@/lib/api-response'

export const POST = withErrors(async (request: Request) => {
  const rl = authRateLimit(request, 'reset')
  if (!rl.ok) return fail(429, 'Quá nhiều yêu cầu, thử lại sau')

  const body = await request.json().catch(() => ({}))
  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) return failValidation(parsed.error)
  const { token, password } = parsed.data

  const crypto = await import('node:crypto')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, bannedAt: true } } },
  })

  if (!record) throw httpError(400, 'Token không hợp lệ')
  if (record.usedAt) throw httpError(400, 'Token đã được sử dụng')
  if (record.expiresAt.getTime() < Date.now()) throw httpError(400, 'Token đã hết hạn')
  if (record.user.bannedAt) throw httpError(403, 'Tài khoản đã bị cấm')

  const newHash = await hashPassword(password)
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: newHash } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ])

  await createSession(record.user.id, record.user.email, false)
  return ok({ message: 'Đặt lại mật khẩu thành công', redirectTo: '/chat' })
})
