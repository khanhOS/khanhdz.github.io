'use client'

import { useState, FormEvent } from 'react'
import {
  Terminal, Loader2, AlertTriangle, Check, ChevronRight, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface CmdHistoryItem {
  cmd: string
  ok: boolean
  message: string
  at: string
}

export function CommandConsole() {
  const [cmd, setCmd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<CmdHistoryItem[]>([])
  const [commands, setCommands] = useState<{ cmd: string; desc: string }[]>([])

  async function loadCommands() {
    try {
      const res = await fetch('/api/owner/command')
      const data = await res.json()
      if (Array.isArray(data.commands)) setCommands(data.commands)
    } catch (err) {
      console.error(err)
    }
  }

  // Load available commands once
  if (commands.length === 0 && !loading) {
    void loadCommands()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!cmd.trim()) return
    setLoading(true)
    setError(null)
    const sentCmd = cmd.trim()
    setCmd('')
    try {
      const res = await fetch('/api/owner/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: sentCmd }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data?.error || 'Lỗi khi chạy lệnh'
        setError(msg)
        setHistory((h) => [{ cmd: sentCmd, ok: false, message: msg, at: new Date().toISOString() }, ...h])
        return
      }
      setHistory((h) => [
        { cmd: sentCmd, ok: !!data.ok, message: data.message || 'OK', at: new Date().toISOString() },
        ...h,
      ])
      toast.success(data.message || 'Thành công')
    } catch (err: any) {
      setError(err?.message || 'Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }

  function fillCommand(c: string) {
    setCmd(c.split(' ')[0] + ' ')
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Command Console</h1>
            <p className="text-sm text-muted-foreground">
              Owner-only — chạy lệnh quản lý trực tiếp.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md border-2 border-destructive/50 bg-destructive/10 text-destructive text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Command input */}
        <section className="khanhos-card p-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <span className="text-primary font-mono text-sm shrink-0">$</span>
            <Input
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              placeholder="/give plus user@example.com"
              className="font-mono flex-1"
              autoFocus
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !cmd.trim()}
              className="khanhos-btn khanhos-btn-primary h-9"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
              Chạy
            </Button>
          </form>
        </section>

        {/* History */}
        <section className="khanhos-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold tracking-wide text-sm">Lịch sử lệnh</h2>
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Xoá
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">Chưa có lệnh nào.</p>
            ) : (
              history.map((h, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-md border border-border bg-secondary/30 font-mono text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-primary">$</span>
                    <span className="flex-1 break-all">{h.cmd}</span>
                    {h.ok ? (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    )}
                  </div>
                  <div className={cn('mt-1 pl-4', h.ok ? 'text-muted-foreground' : 'text-destructive')}>
                    {h.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Available commands */}
        <section className="khanhos-card p-4">
          <h2 className="font-semibold tracking-wide text-sm mb-3">Lệnh khả dụng</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {commands.map((c) => (
              <button
                key={c.cmd}
                onClick={() => fillCommand(c.cmd)}
                className="text-left p-2.5 rounded-md border border-border bg-secondary/30 hover:border-primary/40 transition-all"
              >
                <div className="font-mono text-xs text-primary">{c.cmd}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.desc}</div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
