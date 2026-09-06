import { redirect } from 'next/navigation'
import { getCurrentUser, type AuthUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { AppShell } from '@/components/layout/app-shell'
import { PLAN_TOKEN_LIMITS, formatTokens } from '@/lib/plans'
import { ChangePasswordForm } from '@/components/account/change-password-form'

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/account')

  return (
    <AppShell>
      <AccountPageContent user={user} />
    </AppShell>
  )
}

async function AccountPageContent({ user }: { user: AuthUser }) {
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      email: true, role: true, plan: true, tokenLimit: true,
      tokenUsed: true, approved: true, approvedAt: true, createdAt: true,
    },
  })
  if (!dbUser) redirect('/login')

  const isOwner = user.role === 'OWNER'
  const effectiveLimit = isOwner ? 999_999_999 : (PLAN_TOKEN_LIMITS[user.plan] ?? dbUser.tokenLimit)
  const percent = effectiveLimit > 0 ? Math.min(100, (dbUser.tokenUsed / effectiveLimit) * 100) : 0

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-primary/15 border border-primary/30 flex items-center justify-center text-primary text-lg font-bold">
            {(dbUser.email[0] || 'U').toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Tài khoản</h1>
            <p className="text-sm text-muted-foreground">Quản lý thông tin và bảo mật tài khoản.</p>
          </div>
        </div>

        {/* Info grid */}
        <section className="khanhos-card p-5">
          <h2 className="font-semibold tracking-wide mb-4">Thông tin chung</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Email" value={dbUser.email} mono />
            <InfoRow label="Vai trò" value={dbUser.role} />
            <InfoRow label="Gói hiện tại" value={dbUser.plan} highlight />
            <InfoRow
              label="Ngày đăng ký"
              value={new Date(dbUser.createdAt).toLocaleString('vi-VN')}
            />
            <InfoRow
              label="Trạng thái"
              value={dbUser.approved ? 'Đã duyệt' : 'Chưa duyệt'}
            />
            {dbUser.approvedAt && (
              <InfoRow
                label="Ngày được duyệt"
                value={new Date(dbUser.approvedAt).toLocaleString('vi-VN')}
              />
            )}
          </div>
        </section>

        {/* Token usage */}
        <section className="khanhos-card p-5">
          <h2 className="font-semibold tracking-wide mb-1">Token usage</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Lượng token đã sử dụng trong tháng của gói {dbUser.plan}.
          </p>
          <div className="flex items-end justify-between mb-2">
            <div className="text-2xl font-bold">
              {formatTokens(dbUser.tokenUsed)}
              <span className="text-sm text-muted-foreground"> / {formatTokens(effectiveLimit)}</span>
            </div>
            <div className="text-sm font-mono text-primary">{percent.toFixed(1)}%</div>
          </div>
          <div className="h-3 rounded-md bg-secondary border border-border overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </section>

        {/* Change password */}
        <ChangePasswordForm />
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <div className="p-3 rounded-md border border-border bg-secondary/30">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm font-medium ${mono ? 'font-mono' : ''} ${highlight ? 'text-primary' : ''}`}>
        {value}
      </div>
    </div>
  )
}

