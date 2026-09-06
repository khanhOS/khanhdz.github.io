import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/layout/app-shell'
import { ChatView } from '@/components/chat/chat-view'
import { PLAN_TOKEN_LIMITS } from '@/lib/plans'

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/chat')

  const { id } = await params

  const [conversations, conv] = await Promise.all([
    db.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    }),
    db.conversation.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        title: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, role: true, content: true, createdAt: true },
        },
      },
    }),
  ])

  if (!conv) redirect('/chat')

  return (
    <AppShell>
      <ChatView
        initialConversationId={conv.id}
        initialMessages={conv.messages}
        initialConversations={conversations.map((c) => ({
          id: c.id,
          title: c.title,
          messageCount: c._count.messages,
          updatedAt: c.updatedAt.toISOString(),
        }))}
        initialUsed={user.tokenUsed}
        initialLimit={
          user.role === 'OWNER' ? 999_999_999 : (PLAN_TOKEN_LIMITS[user.plan] ?? user.tokenLimit)
        }
        initialPlan={user.plan}
      />
    </AppShell>
  )
}
