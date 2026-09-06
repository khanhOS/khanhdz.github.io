'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[error-boundary]', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto h-20 w-20 bg-destructive/15 border-2 border-destructive/30 flex items-center justify-center text-destructive mb-6">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <div className="text-7xl font-extrabold tracking-tighter text-destructive mb-2">500</div>
        <h1 className="text-2xl font-bold mb-2">Lỗi máy chủ</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Đã có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại hoặc quay lại sau.
          {error.digest && (
            <span className="block mt-2 text-xs font-mono">Error ID: {error.digest}</span>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="khanhos-btn khanhos-btn-primary">
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </button>
          <Link href="/" className="khanhos-btn">
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
