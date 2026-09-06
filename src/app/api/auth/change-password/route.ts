import { db } from '@/lib/db'
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth'
import { changePasswordSchema } from '@/lib/validation'
import { ok, fail, failValidation, withErrors, httpError } from '@/lib/api-response'

export const POST = withErrors(async (request: Request) => {
  const user = await getCurrentUser()
  if (!user) throw httpError(401, 'UNAUTHORIZED')

  const body = await request.json().catch(() => ({}))
  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) return failValidation(parsed.error)
  const { currentPassword, newPassword } = parsed.data

  const full = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } })
  if (!full) throw httpError(404, 'User not found')

  const ok_ = await verifyPassword(currentPassword, full.passwordHash)
  if (!ok_) return fail(400, 'Mật khẩu hiện tại không đúng')
  if (currentPassword === newPassword) return fail(400, 'Mật khẩu mới phải khác mật khẩu hiện tại')

  const newHash = await hashPassword(newPassword)
  await db.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })

  return ok({ message: 'Đổi mật khẩu thành công' })
})
