import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/layout/app-shell'
import { ScrollText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OwnerLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string; pageSize?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/owner/logs')
  if (user.role !== 'ADMIN' && user.role !== 'OWNER') redirect('/chat')

  const sp = await searchParams
  const action = sp.action?.trim() || ''
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.pageSize || '50', 10) || 50))

  const where = action ? { action: { contains: action } } : {}
  const [total, logs] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true, actorUserId: true, action: true, detail: true,
        metadataJson: true, targetUserId: true, createdAt: true,
        actor: { select: { email: true } },
        target: { select: { email: true } },
      },
    }),
  ])

  const rows = logs.map((l) => ({
    id: l.id,
    actor: l.actor?.email || l.actorUserId,
    action: l.action,
    detail: l.detail,
    metadata: (() => { try { return JSON.parse(l.metadataJson) } catch { return {} } })(),
    target: l.target?.email || null,
    createdAt: l.createdAt.toISOString(),
  }))

  const pages = Math.ceil(total / pageSize)

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <ScrollText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Audit Logs</h1>
              <p className="text-sm text-muted-foreground">
                {total} log · page {page}/{pages || 1}
              </p>
            </div>
          </div>

          <section className="khanhos-card overflow-hidden">
            <div className="overflow-x-auto max-h-[75vh] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-secondary/80 backdrop-blur">
                  <tr className="border-b-2 border-border">
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Thời gian</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Actor</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Action</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Target</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Chưa có log nào.
                      </td>
                    </tr>
                  ) : (
                    rows.map((l) => (
                      <tr key={l.id} className="border-b border-border hover:bg-secondary/30">
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                          {new Date(l.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-3 py-2 font-mono">{l.actor}</td>
                        <td className="px-3 py-2">
                          <span className="text-primary font-mono text-[10px] uppercase tracking-widest bg-primary/10 px-1.5 py-0.5 rounded border border-primary/30">
                            {l.action}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{l.target || '—'}</td>
                        <td className="px-3 py-2">{l.detail}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
