import { db } from '@/lib/db'
import { verifyPassword, createSession, resolveRole, isOwnerEmail } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'
import { authRateLimit } from '@/lib/rate-limit'
import { ok, fail, failValidation, withErrors } from '@/lib/api-response'

export const POST = withErrors(async (request: Request) => {
  const rl = authRateLimit(request, 'login')
  if (!rl.ok) return fail(429, 'Quá nhiều lần thử, vui lòng đợi 60 giây')

  const body = await request.json().catch(() => ({}))
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return failValidation(parsed.error)
  const { email, password, remember } = parsed.data

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true, role: true, plan: true, tokenLimit: true, tokenUsed: true, bannedAt: true, approved: true },
  })

  if (!user) return fail(401, 'Email hoặc mật khẩu không đúng')
  const passwordOk = await verifyPassword(password, user.passwordHash)
  if (!passwordOk) return fail(401, 'Email hoặc mật khẩu không đúng')
  if (user.bannedAt) return fail(403, 'Tài khoản của bạn đã bị cấm. Liên hệ Owner để được hỗ trợ.')

  const isOwner = isOwnerEmail(user.email)
  if (!isOwner && !user.approved) {
    return fail(403, 'Tài khoản của bạn chưa được Owner duyệt. Vui lòng chờ được duyệt trước khi đăng nhập.')
  }

  await createSession(user.id, user.email, remember)
  const role = resolveRole(user)
  const redirectTo = role === 'OWNER' ? '/owner' : '/chat'

  return ok({
    user: { id: user.id, email: user.email, role, plan: user.plan, tokenLimit: user.tokenLimit, tokenUsed: user.tokenUsed },
    redirectTo,
  })
})
