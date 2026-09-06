import { Sidebar } from '@/components/layout/sidebar'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const dbUser = user
    ? await db.user.findUnique({
        where: { id: user.id },
        select: { role: true, email: true },
      })
    : null

  const isOwner = (dbUser && user?.role === 'OWNER') || false
  const email = dbUser?.email || user?.email

  return (
    <div className="min-h-screen flex">
      <Sidebar isOwner={isOwner} userEmail={email} />
      <main className="flex-1 min-w-0 flex flex-col">{children}</main>
    </div>
  )
}
