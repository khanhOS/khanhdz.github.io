import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { ok, withErrors } from '@/lib/api-response'

export const GET = withErrors(async (request: Request) => {
  await requireAdmin()
  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '50', 10) || 50))
  const action = url.searchParams.get('action')

  const where = action ? { action: { contains: action } } : {}
  const [total, logs] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize, skip: (page - 1) * pageSize,
      select: {
        id: true, actorUserId: true, action: true, detail: true,
        metadataJson: true, targetUserId: true, createdAt: true,
        actor: { select: { email: true } },
        target: { select: { email: true } },
      },
    }),
  ])

  return ok({
    logs: logs.map((l) => ({
      id: l.id,
      actor: l.actor?.email || l.actorUserId,
      action: l.action, detail: l.detail,
      metadata: (() => { try { return JSON.parse(l.metadataJson) } catch { return {} } })(),
      target: l.target?.email || null,
      createdAt: l.createdAt.toISOString(),
    })),
    pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
  })
})
