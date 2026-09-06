'use client'

import { useState, useEffect } from 'react'
import {
  FileCode, Download, Loader2, AlertTriangle, File as FileIcon,
  FolderTree, HardDrive, Files, Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface FileEntry {
  path: string
  size: number
  type: 'file' | 'dir'
  category?: string
}

interface FilesData {
  files: {
    config: FileEntry[]
    prisma: FileEntry[]
    src: FileEntry[]
    public: FileEntry[]
  }
  stats: {
    totalFiles: number
    totalSize: number
    totalSizeFormatted: string
  }
  zipUrl: string
}

export function FilesClient() {
  const [data, setData] = useState<FilesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zipping, setZipping] = useState(false)
  const [activeTab, setActiveTab] = useState<'config' | 'prisma' | 'src' | 'public'>('src')

  async function loadFiles() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/files/list')
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'Lỗi khi tải danh sách')
      setData(d as FilesData)
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi tải danh sách')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFiles()
  }, [])

  async function downloadZip() {
    setZipping(true)
    try {
      const res = await fetch('/api/owner/files/zip')
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Lỗi khi tạo ZIP')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `khanhos-ai-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Đã tải ZIP')
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi tạo ZIP')
    } finally {
      setZipping(false)
    }
  }

  function downloadFile(p: string) {
    window.open(`/api/owner/files/download?path=${encodeURIComponent(p)}`, '_blank')
  }

  const tabs: { id: keyof FilesData['files']; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'src', label: 'Source', icon: FileCode },
    { id: 'config', label: 'Config', icon: Files },
    { id: 'prisma', label: 'Prisma', icon: HardDrive },
    { id: 'public', label: 'Public', icon: FolderTree },
  ]

  const activeFiles = data ? data.files[activeTab] : []

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <FolderTree className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">Web Files</h1>
            <p className="text-sm text-muted-foreground">
              Quản lý & download source code dự án (Owner only).
            </p>
          </div>
          <Button
            onClick={downloadZip}
            disabled={zipping}
            className="khanhos-btn khanhos-btn-primary"
          >
            {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
            Tải ZIP
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-md border-2 border-destructive/50 bg-destructive/10 text-destructive text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Stats */}
        {data && (
          <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="khanhos-card p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tổng files</div>
              <div className="text-2xl font-extrabold mt-1">{data.stats.totalFiles}</div>
            </div>
            <div className="khanhos-card p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tổng dung lượng</div>
              <div className="text-2xl font-extrabold mt-1">{data.stats.totalSizeFormatted}</div>
            </div>
            <div className="khanhos-card p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Source files</div>
              <div className="text-2xl font-extrabold mt-1">{data.files.src.length}</div>
            </div>
          </section>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const Icon = t.icon
            const count = data ? data.files[t.id].length : 0
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'khanhos-btn text-xs',
                  activeTab === t.id && 'khanhos-btn-primary'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                <span className="ml-1 text-[10px] opacity-70">({count})</span>
              </button>
            )
          })}
        </div>

        {/* File list */}
        <section className="khanhos-card p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="ml-2 text-sm">Đang tải...</span>
            </div>
          ) : activeFiles.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Không có file.</p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto -mx-2">
              <ul className="divide-y divide-border">
                {activeFiles.map((f) => (
                  <li key={f.path} className="flex items-center justify-between gap-3 px-2 py-2 hover:bg-secondary/30">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="font-mono text-xs truncate">{f.path}</div>
                        {f.category && (
                          <div className="text-[10px] text-primary uppercase tracking-widest">{f.category}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatBytes(f.size)}
                      </span>
                      <button
                        onClick={() => downloadFile(f.path)}
                        className="p-1.5 rounded border border-border hover:border-primary/40 hover:text-primary"
                        aria-label="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
