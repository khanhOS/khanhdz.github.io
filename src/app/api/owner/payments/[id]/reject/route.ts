import { db } from '@/lib/db'
import { requireOwner } from '@/lib/auth'
import { ok, fail, withErrors, httpError } from '@/lib/api-response'

export const POST = withErrors(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const owner = await requireOwner()
    const { id } = await ctx.params

    const payment = await db.payment.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true, plan: true, amount: true },
    })
    if (!payment) throw httpError(404, 'Không tìm thấy payment')
    if (payment.status !== 'PENDING') {
      return Response.json({ error: `Payment đã ở trạng thái ${payment.status}` }, { status: 400 })
    }

    await db.payment.update({
      where: { id },
      data: { status: 'REJECTED', rejectedAt: new Date(), rejectedBy: owner.id },
    })

    await db.auditLog.create({
      data: {
        actorUserId: owner.id, targetUserId: payment.userId,
        action: 'reject_payment',
        detail: `Rejected payment ${payment.id} (${payment.plan}, ${payment.amount}đ)`,
        metadataJson: JSON.stringify({ paymentId: payment.id, plan: payment.plan, amount: payment.amount }),
      },
    })

    return ok({ message: 'Đã từ chối payment' })
  }
)
