// KhanhOS AI — Mail helper (SMTP optional)
interface SendMailInput {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendMail(input: SendMailInput): Promise<{
  delivered: 'smtp' | 'console'
  detail?: string
}> {
  const smtpHost = process.env.SMTP_HOST?.trim()
  const smtpUser = process.env.SMTP_USER?.trim()
  const smtpPass = process.env.SMTP_PASS?.trim()

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const nodemailer = await import('nodemailer').catch(() => null)
      if (nodemailer) {
        const transport = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT || 587) === 465,
          auth: { user: smtpUser, pass: smtpPass },
        })
        const fromAddr = process.env.SMTP_FROM || `KhanhOS AI <${smtpUser}>`
        await transport.sendMail({
          from: fromAddr, to: input.to, subject: input.subject,
          text: input.text, html: input.html || input.text.replace(/\n/g, '<br/>'),
        })
        return { delivered: 'smtp', detail: 'sent' }
      }
    } catch (err) {
      console.error('[mail] SMTP send failed, falling back to console:', err)
    }
  }

  console.log('\n========== KhanhOS AI — EMAIL (no SMTP) ==========')
  console.log(`To:      ${input.to}`)
  console.log(`Subject: ${input.subject}`)
  console.log('--------------------------------------------------')
  console.log(input.text)
  console.log('==================================================\n')
  return { delivered: 'console', detail: 'logged-to-server-console' }
}

export function buildPasswordResetEmail(opts: {
  to: string
  resetLink: string
}): { subject: string; text: string; html: string } {
  const subject = 'KhanhOS AI — Đặt lại mật khẩu'
  const text = [
    'Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu KhanhOS AI.',
    '',
    `Email: ${opts.to}`,
    '',
    'Nhấn vào link bên dưới để đặt lại mật khẩu (hết hạn sau 30 phút):',
    opts.resetLink,
    '',
    'Nếu bạn không yêu cầu hành động này, hãy bỏ qua email này.',
    '',
    '— KhanhOS AI',
  ].join('\n')
  const html = `
    <div style="font-family: monospace, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background:#1a1d24; color:#e8eaed; border:2px solid #2bd4a0;">
      <h2 style="color:#2bd4a0; margin:0 0 12px 0;">KhanhOS AI</h2>
      <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu.</p>
      <p><strong>Email:</strong> ${opts.to}</p>
      <p>Nhấn vào nút bên dưới để đặt lại mật khẩu (link hết hạn sau 30 phút):</p>
      <p style="margin:24px 0;">
        <a href="${opts.resetLink}" style="display:inline-block; background:#2bd4a0; color:#1a1d24; padding:12px 24px; text-decoration:none; border-radius:4px; font-weight:bold;">Đặt lại mật khẩu</a>
      </p>
      <p style="font-size:12px; color:#9aa0a6; word-break:break-all;">Hoặc sao chép link: ${opts.resetLink}</p>
      <p style="font-size:12px; color:#9aa0a6;">Nếu bạn không yêu cầu hành động này, hãy bỏ qua email này.</p>
    </div>
  `
  return { subject, text, html }
}
