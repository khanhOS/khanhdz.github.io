import { db } from '@/lib/db'
import { hashPassword, createSession, resolveRole, isOwnerEmail } from '@/lib/auth'
import { registerSchema } from '@/lib/validation'
import { authRateLimit } from '@/lib/rate-limit'
import { ok, fail, failValidation, withErrors } from '@/lib/api-response'
import { PLAN_TOKEN_LIMITS } from '@/lib/plans'

export const POST = withErrors(async (request: Request) => {
  const rl = authRateLimit(request, 'register')
  if (!rl.ok) return fail(429, 'Quá nhiều yêu cầu đăng ký, thử lại sau 60 giây')

  const body = await request.json().catch(() => ({}))
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) return failValidation(parsed.error)
  const { email, password, phone, remember } = parsed.data

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) return fail(409, 'Email đã được đăng ký. Vui lòng đăng nhập.')

  const passwordHash = await hashPassword(password)
  const isOwner = isOwnerEmail(email)
  const initialRole = isOwner ? 'OWNER' : 'USER'
  const initialTokenLimit = isOwner ? 999_999_999 : PLAN_TOKEN_LIMITS.FREE
  const initialApproved = isOwner

  const user = await db.user.create({
    data: {
      email, passwordHash,
      phone: phone || null,
      role: initialRole,
      plan: 'FREE',
      tokenLimit: initialTokenLimit,
      tokenUsed: 0,
      approved: initialApproved,
      ...(isOwner ? { approvedAt: new Date() } : {}),
    },
    select: { id: true, email: true, role: true, plan: true, tokenLimit: true, tokenUsed: true, approved: true },
  })

  if (user.approved) {
    await createSession(user.id, user.email, remember)
  }

  const role = resolveRole(user)

  if (!user.approved) {
    return ok({
      user: { id: user.id, email: user.email, role, plan: user.plan, tokenLimit: user.tokenLimit, tokenUsed: user.tokenUsed, approved: false },
      pendingApproval: true,
      redirectTo: '/pending-approval',
      message: 'Tài khoản đã được tạo. Vui lòng chờ Owner duyệt trước khi đăng nhập.',
    })
  }

  const redirectTo = role === 'OWNER' ? '/owner' : '/chat'
  return ok({
    user: { id: user.id, email: user.email, role, plan: user.plan, tokenLimit: user.tokenLimit, tokenUsed: user.tokenUsed, approved: true },
    redirectTo,
  })
})
