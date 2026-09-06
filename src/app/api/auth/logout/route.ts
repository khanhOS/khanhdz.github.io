import { destroySession } from '@/lib/auth'
import { ok, withErrors } from '@/lib/api-response'

export const POST = withErrors(async () => {
  await destroySession()
  return ok({ redirectTo: '/' })
})
