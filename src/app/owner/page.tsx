import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/layout/app-shell'
import { StatCard } from '@/components/owner/stat-card'
import { formatTokens } from '@/lib/plans'
import {
  Users, UserCheck, Crown, UserX, UserMinus, Activity,
  Cpu, Coins, CreditCard, AlertTriangle, Wallet,
} from 'lucide-react'

export default async function OwnerDashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/owner')
  if (user.role !== 'ADMIN' && user.role !== 'OWNER') redirect('/chat')

  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [
    totalUsers, plusUsers, maxUsers, freeUsers, bannedUsers,
    aiRequests24h, totalTokensUsed, pendingPayments, errorCount,
    approvedPaymentsAgg,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { plan: 'PLUS' } }),
    db.user.count({ where: { plan: 'MAX' } }),
    db.user.count({ where: { plan: 'FREE' } }),
    db.user.count({ where: { NOT: { bannedAt: null } } }),
    db.usage.count({ where: { createdAt: { gte: dayAgo } } }),
    db.user.aggregate({ _sum: { tokenUsed: true } }),
    db.payment.count({ where: { status: 'PENDING' } }),
    db.payment.count({ where: { status: 'REJECTED' } }),
    db.payment.aggregate({ where: { status: 'APPROVED' }, _sum: { amount: true } }),
  ])

  const approvedPaymentsAmount = approvedPaymentsAgg._sum.amount || 0

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Owner Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Tổng quan hệ thống KhanhOS AI.
              </p>
            </div>
          </div>

          <section>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-mono">
              Người dùng
            </h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Tổng users" value={totalUsers} icon={Users} highlight />
              <StatCard label="FREE" value={freeUsers} icon={Users} />
              <StatCard label="PLUS" value={plusUsers} icon={UserCheck} />
              <StatCard label="MAX" value={maxUsers} icon={Crown} />
              <StatCard label="Banned" value={bannedUsers} icon={UserMinus} />
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-mono">
              Hoạt động
            </h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              <StatCard label="AI requests 24h" value={aiRequests24h} icon={Activity} highlight />
              <StatCard label="Tokens đã dùng" value={formatTokens(totalTokensUsed._sum.tokenUsed || 0)} icon={Cpu} />
              <StatCard label="Pending payments" value={pendingPayments} icon={CreditCard} />
              <StatCard label="Doanh thu đã duyệt" value={`${new Intl.NumberFormat('vi-VN').format(approvedPaymentsAmount)}đ`} icon={Wallet} highlight />
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-mono">
              Khác
            </h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              <StatCard label="Payments bị từ chối" value={errorCount} icon={AlertTriangle} />
              <StatCard label="UserX" value="—" icon={UserX} />
              <StatCard label="Coins" value="∞" icon={Coins} />
            </div>
          </section>

          <section className="khanhos-card p-5">
            <h2 className="font-semibold tracking-wide mb-2">Truy cập nhanh</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-sm">
              {[
                { href: '/owner/users', label: 'Users' },
                { href: '/owner/payments', label: 'Payments' },
                { href: '/owner/logs', label: 'Audit Logs' },
                { href: '/owner/commands', label: 'Commands' },
                { href: '/owner/files', label: 'Files' },
                { href: '/owner/settings', label: 'Settings' },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="khanhos-btn text-xs py-2"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
