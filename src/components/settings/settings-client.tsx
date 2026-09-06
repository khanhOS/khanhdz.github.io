'use client'

import { useState } from 'react'
import {
  Palette, MessageSquare, ShieldCheck, Moon, Sun, Monitor,
  Loader2, AlertTriangle, Check,
} from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface SettingsData {
  theme: 'dark' | 'light' | 'system'
  enterToSend: boolean
  showMarkdown: boolean
  autoScroll: boolean
  soundEnabled: boolean
}

interface SettingsClientProps {
  initialSettings: SettingsData
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<SettingsData>(initialSettings)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function update<K extends keyof SettingsData>(key: K, value: SettingsData[K]) {
    setSettings((s) => ({ ...s, [key]: value }))
    setError(null)
    setSavingKey(key)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Lỗi khi cập nhật')
      }
      toast.success('Đã lưu cài đặt')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Lỗi khi cập nhật')
      // revert
      setSettings((s) => ({ ...s, [key]: !value as SettingsData[K] }))
    } finally {
      setSavingKey(null)
    }
  }

  function updateTheme(value: 'dark' | 'light' | 'system') {
    setTheme(value)
    update('theme', value)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Cài đặt</h1>
            <p className="text-sm text-muted-foreground">
              Tuỳ chỉnh giao diện, chat và quyền riêng tư của KhanhOS AI.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md border-2 border-destructive/50 bg-destructive/10 text-destructive text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Appearance */}
        <SettingsSection icon={Palette} title="Giao diện" description="Chọn theme hiển thị.">
          <div className="grid grid-cols-3 gap-3">
            <ThemeButton
              active={theme === 'dark'}
              onClick={() => updateTheme('dark')}
              label="Tối"
              icon={Moon}
            />
            <ThemeButton
              active={theme === 'light'}
              onClick={() => updateTheme('light')}
              label="Sáng"
              icon={Sun}
            />
            <ThemeButton
              active={theme === 'system'}
              onClick={() => updateTheme('system')}
              label="Hệ thống"
              icon={Monitor}
            />
          </div>
        </SettingsSection>

        {/* Chat */}
        <SettingsSection icon={MessageSquare} title="Chat" description="Tuỳ chỉnh hành vi chat.">
          <ToggleRow
            title="Gửi khi nhấn Enter"
            description="Bật để gửi tin nhắn khi nhấn Enter. Tắt để nhập dòng mới."
            checked={settings.enterToSend}
            saving={savingKey === 'enterToSend'}
            onChange={(v) => update('enterToSend', v)}
          />
          <ToggleRow
            title="Hiển thị Markdown"
            description="Hiển thị phản hồi AI dưới dạng Markdown (tiêu đề, list, code, ...)."
            checked={settings.showMarkdown}
            saving={savingKey === 'showMarkdown'}
            onChange={(v) => update('showMarkdown', v)}
          />
          <ToggleRow
            title="Tự động cuộn"
            description="Tự động cuộn xuống tin nhắn mới nhất khi có phản hồi AI."
            checked={settings.autoScroll}
            saving={savingKey === 'autoScroll'}
            onChange={(v) => update('autoScroll', v)}
          />
          <ToggleRow
            title="Âm thanh thông báo"
            description="Phát âm thanh khi có phản hồi AI hoàn tất."
            checked={settings.soundEnabled}
            saving={savingKey === 'soundEnabled'}
            onChange={(v) => update('soundEnabled', v)}
          />
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection icon={ShieldCheck} title="Quyền riêng tư" description="Thông tin về dữ liệu của bạn.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Tất cả cuộc trò chuyện của bạn được lưu riêng tư, chỉ bạn mới xem được.
              Owner có thể xem audit log (ghi log hành động) cho mục đích bảo mật.
            </p>
            <p>
              Mật khẩu được băm bằng scrypt — KhanhOS không bao giờ lưu mật khẩu dạng plaintext.
              Session sử dụng JWT cookie httpOnly, ký bằng AUTH_SECRET.
            </p>
            <p>
              Bạn có thể xoá tài khoản bất cứ lúc nào bằng cách liên hệ Owner qua email.
            </p>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="khanhos-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-semibold tracking-wide">{title}</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function ThemeButton({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'khanhos-card p-4 flex flex-col items-center gap-2 transition-all',
        active ? 'border-primary/50 khanhos-glow text-primary' : 'hover:border-primary/30'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      {active && <Check className="h-3 w-3" />}
    </button>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  saving,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  saving: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{title}</h3>
          {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
