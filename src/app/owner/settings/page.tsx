import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/layout/app-shell'
import { MaintenanceToggleClient } from '@/components/owner/maintenance-toggle-client'
import { Settings, Check, X, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ENV_VARS = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'OWNER_EMAIL',
  'CEREBRAS_API_KEY',
  'CEREBRAS_MODEL',
  'APP_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'PAYMENT_MEMO_PREFIX',
  'PAYMENT_BANK_NAME',
  'PAYMENT_BANK_ACCOUNT_NAME',
  'PAYMENT_BANK_ACCOUNT_NUMBER',
]

export default async function OwnerSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/owner/settings')
  if (user.role !== 'ADMIN' && user.role !== 'OWNER') redirect('/chat')

  const settings = await db.systemSetting.findMany()
  const settingsMap: Record<string, string> = {}
  for (const s of settings) settingsMap[s.id] = s.value

  const maintenanceOn = settingsMap['maintenance'] === 'on'
  const isOwner = user.role === 'OWNER'

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">System Settings</h1>
              <p className="text-sm text-muted-foreground">
                Cấu hình hệ thống và kiểm tra environment variables.
              </p>
            </div>
          </div>

          {/* Maintenance mode */}
          <section className="khanhos-card p-5">
            <h2 className="font-semibold tracking-wide mb-1">Maintenance Mode</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Khi bật, mọi API request (ngoại trừ Owner) sẽ trả về 503.
            </p>
            <div className="flex items-center justify-between gap-3 p-3 rounded-md border border-border bg-secondary/30">
              <div>
                <div className="text-sm font-medium">Trạng thái hiện tại</div>
                <div className={maintenanceOn ? 'text-yellow-500 text-xs uppercase tracking-widest' : 'text-primary text-xs uppercase tracking-widest'}>
                  {maintenanceOn ? 'Bật (đang bảo trì)' : 'Tắt (đang hoạt động)'}
                </div>
              </div>
              {!isOwner ? (
                <span className="text-xs text-muted-foreground">Chỉ OWNER mới có thể thay đổi.</span>
              ) : (
                <MaintenanceToggleClient initial={maintenanceOn} />
              )}
            </div>
          </section>

          {/* Env check */}
          <section className="khanhos-card p-5">
            <h2 className="font-semibold tracking-wide mb-1">Environment Variables</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Kiểm tra các biến môi trường đã được cấu hình. Giá trị không hiển thị vì lý do bảo mật.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ENV_VARS.map((name) => {
                const isSet = !!process.env[name]
                return (
                  <div
                    key={name}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-md border border-border bg-secondary/30"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-xs">{name}</div>
                    </div>
                    {isSet ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-primary font-mono">
                        <Check className="h-3 w-3" /> SET
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-destructive font-mono">
                        <X className="h-3 w-3" /> MISSING
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 p-3 rounded-md border-2 border-yellow-500/30 bg-yellow-500/10 text-yellow-500 text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="flex-1">
                Lưu ý: Danh sách này chỉ kiểm tra sự tồn tại của biến môi trường.
                Một số biến có giá trị mặc định trong code nên vẫn hoạt động ngay cả khi MISSING.
              </p>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  )
}

