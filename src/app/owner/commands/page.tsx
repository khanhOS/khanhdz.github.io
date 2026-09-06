import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/layout/app-shell'
import { CommandConsole } from '@/components/owner/command-console'

export default async function OwnerCommandsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/owner/commands')
  if (user.role !== 'OWNER') redirect('/chat')

  return (
    <AppShell>
      <CommandConsole />
    </AppShell>
  )
}
