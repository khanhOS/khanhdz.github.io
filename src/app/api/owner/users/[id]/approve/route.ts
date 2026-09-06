import { db } from '@/lib/db'
import { requireOwner } from '@/lib/auth'
import { ok, fail, withErrors, httpError } from '@/lib/api-response'

export const POST = withErrors(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const owner = await requireOwner()
    const { id } = await ctx.params

    const user = await db.user.findUnique({
      where: { id },
      select: { id: true, email: true, phone: true, approved: true, bannedAt: true },
    })
    if (!user) throw httpError(404, 'Không tìm thấy user')
    if (user.bannedAt) return fail(400, 'User đã bị cấm. Hãy unban trước khi approve.')
    if (user.approved) return fail(400, 'User đã được duyệt rồi')

    await db.user.update({
      where: { id: user.id },
      data: { approved: true, approvedAt: new Date(), approvedBy: owner.id },
    })

    await db.auditLog.create({
      data: {
        actorUserId: owner.id, targetUserId: user.id,
        action: 'approve_user',
        detail: `Approved user ${user.email}`,
        metadataJson: JSON.stringify({ email: user.email, phone: user.phone || null }),
      },
    })

    return ok({ message: `Đã duyệt user ${user.email}. Họ có thể đăng nhập ngay bây giờ.` })
  }
)
