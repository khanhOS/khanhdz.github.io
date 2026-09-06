import { db } from '@/lib/db'
import { forgotPasswordSchema } from '@/lib/validation'
import { authRateLimit } from '@/lib/rate-limit'
import { sendMail, buildPasswordResetEmail } from '@/lib/mail'
import { ok, fail, failValidation, withErrors, httpError } from '@/lib/api-response'

export const POST = withErrors(async (request: Request) => {
  const rl = authRateLimit(request, 'forgot')
  if (!rl.ok) return fail(429, 'Quá nhiều yêu cầu, thử lại sau')

  const body = await request.json().catch(() => ({}))
  const parsed = forgotPasswordSchema.safeParse(body)
  if (!parsed.success) return failValidation(parsed.error)
  const { email } = parsed.data

  const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true } })

  if (user) {
    const crypto = await import('node:crypto')
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    await db.passwordResetToken.deleteMany({ where: { userId: user.id } })
    await db.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } })

    const appUrl = process.env.APP_URL?.replace(/\/$/, '') || 'http://localhost:3000'
    const resetLink = `${appUrl}/reset-password?token=${rawToken}`
    const mailBody = buildPasswordResetEmail({ to: user.email, resetLink })
    try {
      await sendMail({ to: user.email, subject: mailBody.subject, text: mailBody.text, html: mailBody.html })
    } catch (err) {
      console.error('[forgot-password] mail failed:', err)
      throw httpError(500, 'Không thể gửi email đặt lại mật khẩu')
    }
  }

  return ok({
    message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút. Nếu SMTP chưa cấu hình, link sẽ hiển thị trên server console.',
  })
})
