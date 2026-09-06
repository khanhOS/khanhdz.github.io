import Link from 'next/link'
import { Home, Ghost } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto h-20 w-20 bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-primary mb-6 khanhos-glow">
          <Ghost className="h-10 w-10" />
        </div>
        <div className="text-7xl font-extrabold tracking-tighter text-primary mb-2">404</div>
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy trang</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển. Hãy kiểm tra lại đường dẫn.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="khanhos-btn khanhos-btn-primary">
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
          <Link href="/chat" className="khanhos-btn">
            Vào chat
          </Link>
        </div>
      </div>
    </div>
  )
}
