import Link from 'next/link'
import { Clock, ShieldCheck, Hourglass, Mail } from 'lucide-react'

export default function PendingApprovalPage() {
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
        <div className="w-full max-w-lg">
          <div className="khanhos-card p-6 sm:p-8 khanhos-glow text-center">
            <div className="mx-auto h-16 w-16 bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-primary mb-4">
              <Clock className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Đang chờ Owner duyệt</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Tài khoản của bạn đã được tạo thành công nhưng cần được Owner phê duyệt
              trước khi có thể đăng nhập.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3 text-left">
              <InfoBox
                icon={ShieldCheck}
                title="Tại sao cần duyệt?"
                body="Để chống spam và lạm dụng, mọi tài khoản mới cần được Owner phê duyệt thủ công."
              />
              <InfoBox
                icon={Hourglass}
                title="Thời gian chờ"
                body="Thường dưới 24 giờ. Owner sẽ kiểm tra và duyệt tài khoản trong thời gian sớm nhất."
              />
              <InfoBox
                icon={Mail}
                title="Đăng ký chỉ cần email + mật khẩu"
                body="Không cần số điện thoại hay thông tin cá nhân phức tạp."
              />
            </div>

            <div className="mt-6">
              <Link href="/login" className="khanhos-btn text-sm">
                ← Về trang đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function InfoBox({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
}) {
  return (
    <div className="khanhos-card p-4">
      <div className="h-8 w-8 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-2">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-xs font-semibold uppercase tracking-wide">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1">{body}</p>
    </div>
  )
}
