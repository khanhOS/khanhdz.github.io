import { db } from '@/lib/db'
import { requireAdmin, resolveRole, isOwnerEmail } from '@/lib/auth'
import { ok, withErrors, httpError } from '@/lib/api-response'

export const GET = withErrors(async (request: Request) => {
  await requireAdmin()

  const url = new URL(request.url)
  const search = url.searchParams.get('q')?.trim() || ''
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10) || 20))
  const planFilter = url.searchParams.get('plan')
  const statusFilter = url.searchParams.get('status')
  const approvalFilter = url.searchParams.get('approval')

  const where: { AND: any[] } = { AND: [] }
  if (search) where.AND.push({ email: { contains: search } })
  if (planFilter && ['FREE', 'PLUS', 'MAX'].includes(planFilter)) where.AND.push({ plan: planFilter })
  if (statusFilter === 'banned') where.AND.push({ bannedAt: { not: null } })
  if (statusFilter === 'active') where.AND.push({ bannedAt: null })
  if (approvalFilter === 'pending') where.AND.push({ approved: false })
  if (approvalFilter === 'approved') where.AND.push({ approved: true })

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize, skip: (page - 1) * pageSize,
      select: {
        id: true, email: true, phone: true, role: true, plan: true,
        tokenLimit: true, tokenUsed: true, bannedAt: true,
        approved: true, approvedAt: true, createdAt: true,
      },
    }),
  ])

  return ok({
    users: users.map((u) => ({
      id: u.id, email: u.email,
      phone: u.phone || '(chưa cung cấp)',
      role: isOwnerEmail(u.email) ? 'OWNER' : resolveRole(u),
      plan: u.plan, tokenLimit: u.tokenLimit, tokenUsed: u.tokenUsed,
      banned: !!u.bannedAt, approved: u.approved,
      approvedAt: u.approvedAt?.toISOString() || null,
      createdAt: u.createdAt.toISOString(),
    })),
    pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
  })
})
