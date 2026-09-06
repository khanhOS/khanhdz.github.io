import { db } from '@/lib/db'
import { requireOwner } from '@/lib/auth'
import { ok, withErrors } from '@/lib/api-response'

export const GET = withErrors(async () => {
  const owner = await requireOwner()
  const pendingUsers = await db.user.findMany({
    where: { approved: false, bannedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, phone: true, createdAt: true },
  })

  return ok({
    pendingUsers: pendingUsers.map((u) => ({
      id: u.id, email: u.email,
      phone: u.phone || '(chưa cung cấp)',
      createdAt: u.createdAt.toISOString(),
    })),
    count: pendingUsers.length,
    approvedBy: owner.email,
  })
})
