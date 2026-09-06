import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { updateSettingsSchema } from '@/lib/validation'
import { ok, fail, failValidation, withErrors, httpError } from '@/lib/api-response'

export const GET = withErrors(async () => {
  const user = await getCurrentUser()
  if (!user) throw httpError(401, 'UNAUTHORIZED')

  const row = await db.user.findUnique({
    where: { id: user.id },
    select: { settingsJson: true },
  })
  let settings: Record<string, unknown> = {}
  try { settings = row?.settingsJson ? JSON.parse(row.settingsJson) : {} } catch { settings = {} }
  return ok({ settings: defaultSettings(settings) })
})

export const PATCH = withErrors(async (request: Request) => {
  const user = await getCurrentUser()
  if (!user) throw httpError(401, 'UNAUTHORIZED')

  const body = await request.json().catch(() => ({}))
  const parsed = updateSettingsSchema.safeParse(body)
  if (!parsed.success) return failValidation(parsed.error)

  const row = await db.user.findUnique({
    where: { id: user.id },
    select: { settingsJson: true },
  })
  let existing: Record<string, unknown> = {}
  try { existing = row?.settingsJson ? JSON.parse(row.settingsJson) : {} } catch { existing = {} }
  const next = { ...existing, ...parsed.data }

  await db.user.update({
    where: { id: user.id },
    data: { settingsJson: JSON.stringify(next) },
  })

  return ok({ settings: defaultSettings(next) })
})

function defaultSettings(s: Record<string, unknown>) {
  return {
    theme: (s.theme as 'dark' | 'light' | 'system') || 'dark',
    enterToSend: s.enterToSend !== false,
    showMarkdown: s.showMarkdown !== false,
    autoScroll: s.autoScroll !== false,
    soundEnabled: s.soundEnabled === true,
  }
}
