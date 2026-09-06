import { db } from '@/lib/db'
import { requireOwner } from '@/lib/auth'
import { approvePaymentSchema } from '@/lib/validation'
import { setUserPlan } from '@/lib/quota'
import { ok, fail, failValidation, withErrors, httpError } from '@/lib/api-response'

export const POST = withErrors(
  async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
    const owner = await requireOwner()
    const { id } = await ctx.params

    const body = await request.json().catch(() => ({}))
    const parsed = approvePaymentSchema.safeParse(body)
    if (!parsed.success) return failValidation(parsed.error)

    const payment = await db.payment.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, plan: true } } },
    })
    if (!payment) throw httpError(404, 'Không tìm thấy payment')
    if (payment.status !== 'PENDING') return fail(400, `Payment đã ở trạng thái ${payment.status}`)
    if (!['PLUS', 'MAX'].includes(payment.plan)) return fail(400, 'Plan không hợp lệ để duyệt')

    await db.$transaction([
      db.payment.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: owner.id,
          txnRef: parsed.data.txnRef || null,
        },
      }),
    ])

    await setUserPlan(payment.user.id, payment.plan as 'PLUS' | 'MAX', { resetUsage: true })

    await db.auditLog.create({
      data: {
        actorUserId: owner.id, targetUserId: payment.user.id,
        action: 'approve_payment',
        detail: `Approved payment ${payment.id} → ${payment.plan} for ${payment.user.email} (${payment.amount}đ)`,
        metadataJson: JSON.stringify({
          paymentId: payment.id, plan: payment.plan,
          amount: payment.amount, before: payment.user.plan,
        }),
      },
    })

    return ok({ message: `Đã duyệt payment và cấp gói ${payment.plan} cho ${payment.user.email}` })
  }
)
