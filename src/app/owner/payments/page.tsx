import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/layout/app-shell'
import { PaymentsClient } from '@/components/owner/payments-client'

export const dynamic = 'force-dynamic'

export default async function OwnerPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; pageSize?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/owner/payments')
  if (user.role !== 'ADMIN' && user.role !== 'OWNER') redirect('/chat')

  const sp = await searchParams
  const status = sp.status
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.pageSize || '50', 10) || 50))

  const where = status ? { status } : {}
  const [total, payments] = await Promise.all([
    db.payment.count({ where }),
    db.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true, userId: true, plan: true, amount: true, status: true,
        memo: true, txnRef: true, approvedAt: true, rejectedAt: true, createdAt: true,
        user: { select: { email: true } },
      },
    }),
  ])

  const data = payments.map((p) => ({
    id: p.id,
    userId: p.userId,
    userEmail: p.user?.email || '',
    plan: p.plan,
    amount: p.amount,
    status: p.status,
    memo: p.memo,
    txnRef: p.txnRef,
    approvedAt: p.approvedAt?.toISOString() || null,
    rejectedAt: p.rejectedAt?.toISOString() || null,
    createdAt: p.createdAt.toISOString(),
  }))

  return (
    <AppShell>
      <PaymentsClient
        initialPayments={data}
        pagination={{ page, pageSize, total, pages: Math.ceil(total / pageSize) }}
        canApprove={user.role === 'OWNER'}
        currentStatus={status || ''}
      />
    </AppShell>
  )
}
