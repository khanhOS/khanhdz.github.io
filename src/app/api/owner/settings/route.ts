import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { ok, withErrors } from '@/lib/api-response'

export const GET = withErrors(async () => {
  await requireAdmin()
  const rows = await db.systemSetting.findMany()
  const settings: Record<string, string> = {}
  for (const r of rows) settings[r.id] = r.value
  return ok({ settings })
})
