import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/layout/app-shell'
import { SettingsClient } from '@/components/settings/settings-client'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/settings')

  const row = await db.user.findUnique({
    where: { id: user.id },
    select: { settingsJson: true },
  })

  let settings: Record<string, unknown> = {}
  try {
    settings = row?.settingsJson ? JSON.parse(row.settingsJson) : {}
  } catch {
    settings = {}
  }

  const initialSettings = {
    theme: (settings.theme as 'dark' | 'light' | 'system') || 'dark',
    enterToSend: settings.enterToSend !== false,
    showMarkdown: settings.showMarkdown !== false,
    autoScroll: settings.autoScroll !== false,
    soundEnabled: settings.soundEnabled === true,
  }

  return (
    <AppShell>
      <SettingsClient initialSettings={initialSettings} />
    </AppShell>
  )
}
