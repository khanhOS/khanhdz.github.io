import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { ok, withErrors } from '@/lib/api-response'

export const GET = withErrors(async () => {
  const user = await requireAdmin()

  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [
    totalUsers, plusUsers, maxUsers, freeUsers, bannedUsers,
    activeUsers24h, aiRequests24h, totalAiRequests, totalTokensUsed,
    pendingPayments, approvedPaymentsAmount, errorCount,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { plan: 'PLUS' } }),
    db.user.count({ where: { plan: 'MAX' } }),
    db.user.count({ where: { plan: 'FREE' } }),
    db.user.count({ where: { NOT: { bannedAt: null } } }),
    db.user.count({ where: { updatedAt: { gte: dayAgo } } }),
    db.usage.count({ where: { createdAt: { gte: dayAgo } } }),
    db.usage.count(),
    db.user.aggregate({ _sum: { tokenUsed: true } }),
    db.payment.count({ where: { status: 'PENDING' } }),
    db.payment.aggregate({ where: { status: 'APPROVED' }, _sum: { amount: true } }),
    db.payment.count({ where: { status: 'REJECTED' } }),
  ])

  return ok({
    actor: { email: user.email, role: user.role },
    stats: {
      totalUsers, plusUsers, maxUsers, freeUsers, bannedUsers,
      activeUsers24h, aiRequests24h, totalAiRequests,
      totalTokensUsed: totalTokensUsed._sum.tokenUsed || 0,
      pendingPayments,
      approvedPaymentsAmount: approvedPaymentsAmount._sum.amount || 0,
      errorCount,
    },
  })
})
