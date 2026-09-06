import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { ok, withErrors, httpError } from '@/lib/api-response'

export const GET = withErrors(async () => {
  const user = await getCurrentUser()
  if (!user) throw httpError(401, 'UNAUTHORIZED')

  const conversations = await db.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    select: {
      id: true, title: true, pinned: true,
      createdAt: true, updatedAt: true,
      _count: { select: { messages: true } },
    },
  })

  return ok({
    conversations: conversations.map((c) => ({
      id: c.id, title: c.title, pinned: c.pinned,
      messageCount: c._count.messages,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  })
})

export const POST = withErrors(async () => {
  const user = await getCurrentUser()
  if (!user) throw httpError(401, 'UNAUTHORIZED')

  const conv = await db.conversation.create({
    data: { userId: user.id, title: 'New Chat' },
    select: { id: true, title: true },
  })
  return ok({ conversation: conv })
})
