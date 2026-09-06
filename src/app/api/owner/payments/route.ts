import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { ok, withErrors } from '@/lib/api-response'

export const GET = withErrors(async (request: Request) => {
  await requireAdmin()
  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '50', 10) || 50))

  const where = status ? { status } : {}
  const [total, payments] = await Promise.all([
    db.payment.count({ where }),
    db.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize, skip: (page - 1) * pageSize,
      select: {
        id: true, userId: true, plan: true, amount: true, status: true,
        memo: true, txnRef: true, approvedAt: true, rejectedAt: true, createdAt: true,
        user: { select: { email: true } },
      },
    }),
  ])

  return ok({
    payments: payments.map((p) => ({
      id: p.id, userId: p.userId, userEmail: p.user?.email || '',
      plan: p.plan, amount: p.amount, status: p.status,
      memo: p.memo, txnRef: p.txnRef,
      approvedAt: p.approvedAt?.toISOString() || null,
      rejectedAt: p.rejectedAt?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
    })),
    pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
  })
})
