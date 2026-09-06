import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/layout/app-shell'
import { FilesClient } from '@/components/owner/files-client'

export default async function OwnerFilesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/owner/files')
  if (user.role !== 'OWNER') redirect('/chat')

  return (
    <AppShell>
      <FilesClient />
    </AppShell>
  )
}
