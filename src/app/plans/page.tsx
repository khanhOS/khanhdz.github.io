import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/layout/app-shell'
import { PlansClient } from '@/components/plans/plans-client'
import { PLANS } from '@/lib/plans'

export default async function PlansPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/plans')

  const [payments] = await Promise.all([
    db.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true, plan: true, amount: true, status: true,
        memo: true, createdAt: true, approvedAt: true, rejectedAt: true,
      },
    }),
  ])

  return (
    <AppShell>
      <PlansClient
        currentPlan={user.plan}
        plans={PLANS.map((p) => ({
          id: p.id,
          name: p.name,
          tokenLimit: p.tokenLimit,
          priceVnd: p.priceVnd,
          priceLabel: p.priceLabel,
          description: p.description,
          features: p.features,
          highlight: p.highlight,
        }))}
        payments={payments.map((p) => ({
          id: p.id,
          plan: p.plan,
          amount: p.amount,
          status: p.status,
          memo: p.memo,
          createdAt: p.createdAt.toISOString(),
          approvedAt: p.approvedAt?.toISOString() || null,
          rejectedAt: p.rejectedAt?.toISOString() || null,
        }))}
      />
    </AppShell>
  )
}
