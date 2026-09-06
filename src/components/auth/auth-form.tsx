'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Loader2, AlertTriangle, Mail, Lock, Eye, EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Mode = 'login' | 'register' | 'forgot' | 'reset'

interface AuthFormProps {
  mode: Mode
}

const COPY: Record<Mode, { title: string; subtitle: string; submitLabel: string }> = {
  login: { title: 'Đăng nhập', subtitle: 'Chào mừng bạn quay lại KhanhOS AI.', submitLabel: 'Đăng nhập' },
  register: { title: 'Đăng ký', subtitle: 'Tạo tài khoản KhanhOS AI miễn phí.', submitLabel: 'Đăng ký miễn phí' },
  forgot: { title: 'Quên mật khẩu', subtitle: 'Nhập email để nhận link đặt lại mật khẩu.', submitLabel: 'Gửi link đặt lại' },
  reset: { title: 'Đặt lại mật khẩu', subtitle: 'Nhập mật khẩu mới cho tài khoản của bạn.', submitLabel: 'Đặt lại mật khẩu' },
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [showPwdNew, setShowPwdNew] = useState(false)

  const copy = COPY[mode]

  const endpoint = {
    login: '/api/auth/login',
    register: '/api/auth/register',
    forgot: '/api/auth/forgot-password',
    reset: '/api/auth/reset-password',
  }[mode]

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      const form = e.currentTarget
      const fd = new FormData(form)
      const payload: Record<string, unknown> = {}

      if (mode === 'login') {
        payload.email = (fd.get('email') as string)?.trim().toLowerCase()
        payload.password = fd.get('password') as string
        payload.remember = fd.get('remember') === 'on'
      } else if (mode === 'register') {
        payload.email = (fd.get('email') as string)?.trim().toLowerCase()
        payload.password = fd.get('password') as string
        payload.remember = fd.get('remember') === 'on'
      } else if (mode === 'forgot') {
        payload.email = (fd.get('email') as string)?.trim().toLowerCase()
      } else if (mode === 'reset') {
        payload.token = searchParams.get('token') || (fd.get('token') as string) || ''
        payload.password = fd.get('password') as string
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error || 'Đã xảy ra lỗi, vui lòng thử lại.')
        setLoading(false)
        return
      }

      if (mode === 'forgot') {
        setInfo(data?.message || 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.')
        setLoading(false)
        return
      }

      if (mode === 'reset') {
        setInfo(data?.message || 'Đặt lại mật khẩu thành công.')
        const target = data?.redirectTo || '/chat'
        window.location.href = target
        return
      }

      // login / register
      if (data?.pendingApproval || data?.redirectTo === '/pending-approval') {
        window.location.href = '/pending-approval'
        return
      }

      const next = searchParams.get('next')
      const target = (next && next.startsWith('/') && !next.startsWith('//'))
        ? next
        : (data?.redirectTo || '/chat')
      window.location.href = target
    } catch (err) {
      console.error('[auth-form] submit error:', err)
      setError('Lỗi kết nối. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b-2 border-border bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary khanhos-glow flex items-center justify-center text-primary-foreground font-bold text-sm">
              K
            </div>
            <span className="font-bold tracking-wide">KhanhOS</span>
          </Link>
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Về trang chủ
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="khanhos-card p-6 sm:p-8 khanhos-glow">
            <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{copy.subtitle}</p>

            {error && (
              <div className="mt-4 p-3 rounded-md border-2 border-destructive/50 bg-destructive/10 text-destructive text-sm flex items-start gap-2 animate-fade-in">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="flex-1">{error}</p>
              </div>
            )}

            {info && (
              <div className="mt-4 p-3 rounded-md border-2 border-primary/40 bg-primary/10 text-primary text-sm flex items-start gap-2 animate-fade-in">
                <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="flex-1">{info}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {mode === 'reset' && !searchParams.get('token') && (
                <Field label="Token đặt lại" htmlFor="token">
                  <Input id="token" name="token" type="text" autoComplete="off" required />
                </Field>
              )}

              {mode !== 'reset' && (
                <Field label="Email" htmlFor="email">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="ban@example.com"
                      className="pl-9"
                    />
                  </div>
                </Field>
              )}

              {(mode === 'login' || mode === 'register' || mode === 'reset') && (
                <Field
                  label={mode === 'reset' ? 'Mật khẩu mới' : 'Mật khẩu'}
                  htmlFor="password"
                  action={
                    mode === 'login' ? (
                      <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                        Quên mật khẩu?
                      </Link>
                    ) : undefined
                  }
                >
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPwd ? 'text' : 'password'}
                      autoComplete={mode === 'register' ? 'new-password' : mode === 'reset' ? 'new-password' : 'current-password'}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                      aria-label={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
              )}

              {mode === 'register' && (
                <Field label="Xác nhận mật khẩu" htmlFor="confirmPassword">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPwdNew ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwdNew((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                      aria-label={showPwdNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPwdNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
              )}

              {mode === 'login' && (
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="remember"
                    defaultChecked
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  Ghi nhớ đăng nhập
                </label>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="khanhos-btn khanhos-btn-primary w-full h-11"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  copy.submitLabel
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground space-y-2">
              {mode === 'login' && (
                <p>
                  Chưa có tài khoản?{' '}
                  <Link href="/register" className="text-primary hover:underline font-medium">
                    Đăng ký miễn phí
                  </Link>
                </p>
              )}
              {mode === 'register' && (
                <p>
                  Đã có tài khoản?{' '}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Đăng nhập
                  </Link>
                </p>
              )}
              {mode === 'forgot' && (
                <p>
                  Nhớ lại mật khẩu?{' '}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Đăng nhập
                  </Link>
                </p>
              )}
              {mode === 'reset' && (
                <p>
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    ← Về trang đăng nhập
                  </Link>
                </p>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Bằng việc sử dụng KhanhOS AI, bạn đồng ý với điều khoản dịch vụ.
          </p>
        </div>
      </main>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  action,
  children,
}: {
  label: string
  htmlFor: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {action}
      </div>
      {children}
    </div>
  )
}
