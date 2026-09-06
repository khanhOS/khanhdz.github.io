import Link from 'next/link'
import {
  MessageSquare, Sparkles, ShieldCheck, Zap, Code2,
  History, Lock, ArrowRight, Check, Users,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { PLANS, formatTokens } from '@/lib/plans'

export default async function HomePage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-2 border-border bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 bg-primary khanhos-glow flex items-center justify-center text-primary-foreground font-bold">
              K
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base tracking-wide">KhanhOS</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                AI Platform
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link href={user.role === 'OWNER' ? '/owner' : '/chat'} className="khanhos-btn khanhos-btn-primary text-xs sm:text-sm">
                Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="khanhos-btn text-xs sm:text-sm">
                  Đăng nhập
                </Link>
                <Link href="/register" className="khanhos-btn khanhos-btn-primary text-xs sm:text-sm">
                  Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-md border-2 border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-widest text-primary mb-6 khanhos-glow">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Cerebras
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            KhanhOS <span className="text-primary">AI</span>
          </h1>
          <p className="mt-4 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            AI mạnh mẽ, nhanh chóng và dành cho mọi người.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="khanhos-btn khanhos-btn-primary">
              Đăng ký miễn phí
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="khanhos-btn">
              Đăng nhập
            </Link>
          </div>

          {/* Stats strip */}
          <div className="mt-12 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Stat value="∞" label="Cuộc trò chuyện" />
            <Stat value={formatTokens(PLANS[2].tokenLimit)} label="Token / tháng" />
            <Stat value="24/7" label="Sẵn sàng" />
          </div>
        </div>
      </section>

      {/* AI Chat Section */}
      <Section
        eyebrow="AI Chat"
        title="Trò chuyện với AI như chưa từng có"
        description="Hỗ trợ Markdown, code blocks, regenerate, lưu lịch sử tự động — mọi thứ bạn cần để làm việc hiệu quả."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon={Zap} title="Tốc độ siêu nhanh" body="Chạy trên hạ tầng Cerebras — phản hồi tức thì, không độ trễ." />
          <Feature icon={Code2} title="Code blocks" body="Highlight cú pháp cho mọi ngôn ngữ phổ biến, copy 1 chạm." />
          <Feature icon={History} title="Lưu lịch sử" body="Mọi cuộc trò chuyện được lưu tự động như ChatGPT, xem lại bất cứ lúc nào." />
        </div>
      </Section>

      {/* Plans Section */}
      <Section
        eyebrow="Bảng giá"
        title="Gói nào phù hợp với bạn?"
        description="Bắt đầu miễn phí, nâng cấp bất cứ lúc nào. Thanh toán chuyển khoản — Owner duyệt trong vài phút."
      >
        <div className="grid gap-5 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={
                'khanhos-card p-6 flex flex-col relative ' +
                (plan.highlight ? 'khanhos-glow border-primary/50' : '')
              }
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded">
                  Phổ biến
                </div>
              )}
              <div className="text-2xl font-bold tracking-wide">{plan.name}</div>
              <div className="text-3xl font-extrabold mt-2">
                {plan.priceVnd === 0 ? (
                  'Miễn phí'
                ) : (
                  <>
                    {new Intl.NumberFormat('vi-VN').format(plan.priceVnd)}
                    <span className="text-base text-muted-foreground ml-1">đ</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              <ul className="mt-4 space-y-2 text-sm flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={user ? '/plans' : '/register'}
                className={
                  'khanhos-btn mt-6 w-full ' +
                  (plan.highlight ? 'khanhos-btn-primary' : '')
                }
              >
                {plan.id === 'FREE' ? 'Bắt đầu' : `Mua ${plan.name}`}
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* Features Section */}
      <Section
        eyebrow="Tính năng"
        title="Mọi thứ bạn cần trong một nền tảng AI"
        description="KhanhOS AI được thiết kế cho cả người dùng cá nhân và team."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feature icon={MessageSquare} title="Chat tự nhiên" body="Hỏi đáp bằng tiếng Việt, AI hiểu ngữ cảnh và phản hồi mượt mà." />
          <Feature icon={Users} title="Quản lý user" body="Hệ thống phân quyền USER / ADMIN / OWNER, kiểm soát toàn diện." />
          <Feature icon={ShieldCheck} title="Bảo mật" body="Mật khẩu băm scrypt, session JWT, rate-limit chống spam." />
          <Feature icon={Lock} title="Riêng tư" body="Lịch sử trò chuyện chỉ bạn mới xem được. Owner có thể audit." />
        </div>
      </Section>

      {/* Security Section */}
      <Section
        eyebrow="Bảo mật"
        title="An toàn dữ liệu là ưu tiên số 1"
        description="Mọi dữ liệu nhạy cảm được xử lý cẩn thận theo các tiêu chuẩn industry."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature icon={Lock} title="Mật khẩu scrypt" body="Hash bằng scrypt (Node crypto) — không bao giờ lưu plaintext." />
          <Feature icon={ShieldCheck} title="JWT session" body="Cookie httpOnly, ký bằng AUTH_SECRET mạnh. Hết hạn tự động." />
          <Feature icon={Zap} title="Rate limiting" body="Chống brute-force, spam API, auto-throttle theo IP & user." />
        </div>
      </Section>

      {/* CTA */}
      <section className="border-t-2 border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="khanhos-card p-8 sm:p-12 khanhos-glow">
            <h2 className="text-2xl sm:text-3xl font-bold">Sẵn sàng bắt đầu?</h2>
            <p className="mt-2 text-muted-foreground">
              Đăng ký miễn phí — không cần thẻ tín dụng, không trial ẩn.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="khanhos-btn khanhos-btn-primary">
                Đăng ký miễn phí
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="khanhos-btn">
                Tôi đã có tài khoản
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t-2 border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              K
            </div>
            <span className="font-semibold text-sm">KhanhOS AI</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 KhanhOS. Mọi quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">Đăng nhập</Link>
            <Link href="/register" className="hover:text-foreground">Đăng ký</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="khanhos-card p-4">
      <div className="text-2xl sm:text-3xl font-extrabold text-primary">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t-2 border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-10">
          <div className="text-[10px] uppercase tracking-widest text-primary font-mono mb-2">
            {eyebrow}
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">{title}</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{description}</p>
        </div>
        {children}
      </div>
    </section>
  )
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
}) {
  return (
    <div className="khanhos-card p-5 hover:border-primary/40 transition-colors">
      <div className="h-10 w-10 bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{body}</p>
    </div>
  )
}
