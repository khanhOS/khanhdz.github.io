import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { updateConversationSchema } from '@/lib/validation'
import { ok, fail, failValidation, withErrors, httpError } from '@/lib/api-response'

export const GET = withErrors(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await getCurrentUser()
    if (!user) throw httpError(401, 'UNAUTHORIZED')
    const { id } = await ctx.params

    const conv = await db.conversation.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true, title: true, createdAt: true, updatedAt: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, role: true, content: true, createdAt: true },
        },
      },
    })
    if (!conv) throw httpError(404, 'Không tìm thấy cuộc trò chuyện')

    return ok({
      conversation: {
        id: conv.id, title: conv.title,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        messages: conv.messages.map((m) => ({
          id: m.id, role: m.role, content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
      },
    })
  }
)

export const PATCH = withErrors(
  async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await getCurrentUser()
    if (!user) throw httpError(401, 'UNAUTHORIZED')
    const { id } = await ctx.params

    const body = await request.json().catch(() => ({}))
    const parsed = updateConversationSchema.safeParse(body)
    if (!parsed.success) return failValidation(parsed.error)

    const owned = await db.conversation.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    })
    if (!owned) throw httpError(404, 'Không tìm thấy cuộc trò chuyện')

    await db.conversation.update({
      where: { id: owned.id },
      data: { title: parsed.data.title },
    })
    return ok({ title: parsed.data.title })
  }
)

export const DELETE = withErrors(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await getCurrentUser()
    if (!user) throw httpError(401, 'UNAUTHORIZED')
    const { id } = await ctx.params

    const owned = await db.conversation.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    })
    if (!owned) throw httpError(404, 'Không tìm thấy cuộc trò chuyện')

    await db.conversation.delete({ where: { id: owned.id } })
    return ok({ deleted: true })
  }
)
