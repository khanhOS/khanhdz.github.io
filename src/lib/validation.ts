import { z } from 'zod'

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PHONE_REGEX = /^[0-9+\-\s()]{8,15}$/

// Đăng ký chỉ cần email + password (SĐT tùy chọn)
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().max(254)
    .refine((v) => EMAIL_REGEX.test(v), { message: 'Email không hợp lệ' }),
  password: z.string().min(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' }).max(128),
  phone: z.string().trim().max(15)
    .refine((v) => v === '' || PHONE_REGEX.test(v), { message: 'Số điện thoại không hợp lệ' })
    .optional().default(''),
  remember: z.boolean().optional().default(false),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase()
    .refine((v) => EMAIL_REGEX.test(v), { message: 'Email không hợp lệ' }),
  password: z.string().min(1, { message: 'Vui lòng nhập mật khẩu' }).max(128),
  remember: z.boolean().optional().default(false),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' }).max(128),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase()
    .refine((v) => EMAIL_REGEX.test(v), { message: 'Email không hợp lệ' }),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(256),
  password: z.string().min(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' }).max(128),
})

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1).max(64).optional(),
  message: z.string().trim().min(1, 'Tin nhắn không được để trống').max(8000),
  regenerate: z.boolean().optional().default(false),
})

export const updateConversationSchema = z.object({
  title: z.string().trim().min(1).max(120),
})

export const updateSettingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).optional(),
  enterToSend: z.boolean().optional(),
  showMarkdown: z.boolean().optional(),
  autoScroll: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
})

export const checkoutSchema = z.object({ plan: z.enum(['PLUS', 'MAX']) })
export const ownerCommandSchema = z.object({ command: z.string().trim().min(1).max(500) })
export const approvePaymentSchema = z.object({ txnRef: z.string().trim().max(200).optional() })
