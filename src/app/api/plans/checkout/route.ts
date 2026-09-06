import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { checkoutSchema } from '@/lib/validation'
import { PLAN_PRICES, type Plan } from '@/lib/plans'
import { rateLimit, getClientId } from '@/lib/rate-limit'
import { ok, fail, failValidation, withErrors, httpError } from '@/lib/api-response'

export const POST = withErrors(async (request: Request) => {
  const user = await getCurrentUser()
  if (!user) throw httpError(401, 'UNAUTHORIZED')

  const rl = rateLimit({ key: `checkout:${getClientId(request)}`, limit: 5, windowMs: 60_000 })
  if (!rl.ok) return fail(429, 'Quá nhiều yêu cầu, thử lại sau')

  const body = await request.json().catch(() => ({}))
  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) return failValidation(parsed.error)
  const plan = parsed.data.plan as Plan

  if (plan === 'FREE') return fail(400, 'Không thể mua gói FREE')
  if (user.plan === plan) return fail(400, `Bạn đang ở gói ${plan}`)

  const amount = PLAN_PRICES[plan]
  if (amount <= 0) return fail(400, 'Gói không hợp lệ')

  const crypto = await import('node:crypto')
  const shortId = crypto.randomBytes(4).toString('hex').toUpperCase()
  const memoPrefix = process.env.PAYMENT_MEMO_PREFIX || 'KhanhOS'
  const memo = `${memoPrefix}-${shortId}`

  const payment = await db.payment.create({
    data: { userId: user.id, plan, amount, status: 'PENDING', memo },
    select: { id: true, plan: true, amount: true, status: true, memo: true, createdAt: true },
  })

  return ok({
    payment: {
      id: payment.id, plan: payment.plan, amount: payment.amount, status: payment.status,
      memo: payment.memo, createdAt: payment.createdAt.toISOString(),
    },
    bank: {
      bankName: process.env.PAYMENT_BANK_NAME || 'Vietcombank',
      accountName: process.env.PAYMENT_BANK_ACCOUNT_NAME || 'HOANG BAO KHANH',
      accountNumber: process.env.PAYMENT_BANK_ACCOUNT_NUMBER || '0000000000',
    },
    instructions: [
      `Chuyển khoản đúng số tiền ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)} đến tài khoản trên.`,
      `Nhập nội dung chuyển khoản: ${memo}`,
      'Sau khi Owner duyệt, gói của bạn sẽ tự động được cấp.',
      `Payment ID: ${payment.id}`,
    ],
    note: 'Đây là luồng thanh toán thật (chưa nối cổng tự động). Owner sẽ duyệt trong Owner Panel.',
  })
})
