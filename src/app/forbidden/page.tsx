import Link from 'next/link'
import { ShieldX, Home, MessageSquare } from 'lucide-react'

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto h-20 w-20 bg-destructive/15 border-2 border-destructive/30 flex items-center justify-center text-destructive mb-6">
          <ShieldX className="h-10 w-10" />
        </div>
        <div className="text-7xl font-extrabold tracking-tighter text-destructive mb-2">403</div>
        <h1 className="text-2xl font-bold mb-2">Không có quyền truy cập</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Bạn không có quyền truy cập trang này. Nếu đây là nhầm lẫn, vui lòng liên hệ Owner.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/chat" className="khanhos-btn khanhos-btn-primary">
            <MessageSquare className="h-4 w-4" />
            Vào chat
          </Link>
          <Link href="/" className="khanhos-btn">
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
