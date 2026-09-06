import { getCurrentUser } from '@/lib/auth'
import { ok, withErrors } from '@/lib/api-response'

export const GET = withErrors(async () => {
  const user = await getCurrentUser()
  if (!user) return ok({ user: null })
  return ok({
    user: {
      id: user.id, email: user.email, role: user.role, plan: user.plan,
      tokenLimit: user.tokenLimit, tokenUsed: user.tokenUsed,
      approved: user.approved,
      createdAt: user.createdAt.toISOString(),
    },
  })
})
