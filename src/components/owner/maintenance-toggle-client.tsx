'use client'

import { useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface Props {
  initial: boolean
}

export function MaintenanceToggleClient({ initial }: Props) {
  const [on, setOn] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle(next: boolean) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenance: next ? 'on' : 'off' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Lỗi khi cập nhật')
      setOn(next)
      toast.success(next ? 'Đã bật maintenance mode' : 'Đã tắt maintenance mode')
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi cập nhật')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <span className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </span>
      )}
      {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      <Switch checked={on} onCheckedChange={toggle} disabled={loading} />
    </div>
  )
}
