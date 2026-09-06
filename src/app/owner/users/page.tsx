import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser, resolveRole, isOwnerEmail } from '@/lib/auth'
import { AppShell } from '@/components/layout/app-shell'
import { UsersClient } from '@/components/owner/users-client'

export const dynamic = 'force-dynamic'

export default async function OwnerUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    plan?: string
    status?: string
    approval?: string
    page?: string
    pageSize?: string
  }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/owner/users')
  if (user.role !== 'ADMIN' && user.role !== 'OWNER') redirect('/chat')

  const sp = await searchParams
  const search = sp.q?.trim() || ''
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(sp.pageSize || '20', 10) || 20))
  const planFilter = sp.plan
  const statusFilter = sp.status
  const approvalFilter = sp.approval

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
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true, email: true, phone: true, role: true, plan: true,
        tokenLimit: true, tokenUsed: true, bannedAt: true,
        approved: true, approvedAt: true, createdAt: true,
      },
    }),
  ])

  const data = users.map((u) => ({
    id: u.id,
    email: u.email,
    phone: u.phone || '(chưa cung cấp)',
    role: isOwnerEmail(u.email) ? 'OWNER' : resolveRole(u),
    plan: u.plan,
    tokenLimit: u.tokenLimit,
    tokenUsed: u.tokenUsed,
    banned: !!u.bannedAt,
    approved: u.approved,
    approvedAt: u.approvedAt?.toISOString() || null,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <AppShell>
      <UsersClient
        initialUsers={data}
        initialFilters={{
          q: search, plan: planFilter || '', status: statusFilter || '', approval: approvalFilter || '',
        }}
        pagination={{ page, pageSize, total, pages: Math.ceil(total / pageSize) }}
        canApprove={user.role === 'OWNER'}
      />
    </AppShell>
  )
}
