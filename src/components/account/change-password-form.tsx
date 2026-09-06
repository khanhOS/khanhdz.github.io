'use client'

import { useState, FormEvent } from 'react'
import { KeyRound, Loader2, AlertTriangle, Check, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const fd = new FormData(e.currentTarget)
      const currentPassword = fd.get('currentPassword') as string
      const newPassword = fd.get('newPassword') as string
      const confirmPassword = fd.get('confirmPassword') as string

      if (newPassword !== confirmPassword) {
        setError('Mật khẩu mới và xác nhận không khớp.')
        setLoading(false)
        return
      }
      if (newPassword.length < 6) {
        setError('Mật khẩu mới phải có ít nhất 6 ký tự.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Không thể đổi mật khẩu')
        setLoading(false)
        return
      }

      setSuccess(true)
      toast.success('Đổi mật khẩu thành công')
      ;(e.target as HTMLFormElement).reset()
    } catch (err: any) {
      console.error(err)
      setError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="khanhos-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="h-4 w-4 text-primary" />
        <h2 className="font-semibold tracking-wide">Đổi mật khẩu</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Khuyến nghị dùng mật khẩu dài tối thiểu 8 ký tự, kết hợp chữ, số và ký tự đặc biệt.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-md border-2 border-destructive/50 bg-destructive/10 text-destructive text-sm flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="flex-1">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-md border-2 border-primary/40 bg-primary/10 text-primary text-sm flex items-start gap-2">
          <Check className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="flex-1">Đổi mật khẩu thành công. Lần đăng nhập sau sử dụng mật khẩu mới.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="currentPassword" className="text-sm font-medium">
            Mật khẩu hiện tại
          </label>
          <div className="relative">
            <Input
              id="currentPassword"
              name="currentPassword"
              type={showCur ? 'text' : 'password'}
              autoComplete="current-password"
              required
              minLength={6}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCur((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              aria-label={showCur ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="newPassword" className="text-sm font-medium">
            Mật khẩu mới
          </label>
          <div className="relative">
            <Input
              id="newPassword"
              name="newPassword"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={6}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Xác nhận mật khẩu mới
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={6}
          />
        </div>

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
            'Đổi mật khẩu'
          )}
        </Button>
      </form>
    </section>
  )
}
