import { db } from '@/lib/db'
import { PLAN_TOKEN_LIMITS } from '@/lib/plans'
import type { Plan } from '@/lib/plans'

export interface QuotaCheckResult {
  ok: boolean
  used: number
  limit: number
  remaining: number
  percent: number
}

export function calcQuota(used: number, limit: number): QuotaCheckResult {
  const remaining = Math.max(0, limit - used)
  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  return { ok: used < limit, used, limit, remaining, percent }
}

export async function getUserQuota(userId: string): Promise<QuotaCheckResult | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tokenUsed: true, tokenLimit: true, plan: true },
  })
  if (!user) return null
  const limit = PLAN_TOKEN_LIMITS[user.plan as Plan] ?? user.tokenLimit
  return calcQuota(user.tokenUsed, limit)
}

export async function consumeQuota(params: {
  userId: string
  model: string
  inputTokens: number
  outputTokens: number
}): Promise<{ newUsed: number; newLimit: number; remaining: number }> {
  const { userId, model, inputTokens, outputTokens } = params
  const total = inputTokens + outputTokens

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tokenUsed: true, plan: true },
  })
  if (!user) throw new Error('User not found')

  const limit = PLAN_TOKEN_LIMITS[user.plan as Plan] ?? 20000

  const updated = await db.user.update({
    where: { id: userId },
    data: { tokenUsed: { increment: total } },
    select: { tokenUsed: true },
  })

  try {
    await db.usage.create({
      data: { userId, model, inputTokens, outputTokens, totalTokens: total },
    })
  } catch (err) {
    console.error('[quota] usage record failed (non-fatal):', err)
  }

  return {
    newUsed: updated.tokenUsed,
    newLimit: limit,
    remaining: Math.max(0, limit - updated.tokenUsed),
  }
}

export async function setUserPlan(
  userId: string,
  plan: Plan,
  options: { resetUsage?: boolean } = {}
): Promise<{ tokenLimit: number; tokenUsed: number }> {
  const limit = PLAN_TOKEN_LIMITS[plan]
  const updated = await db.user.update({
    where: { id: userId },
    data: { plan, tokenLimit: limit, ...(options.resetUsage ? { tokenUsed: 0 } : {}) },
    select: { tokenLimit: true, tokenUsed: true },
  })
  return updated
}

export async function resetUserQuota(userId: string): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { tokenUsed: 0 } })
}

export async function adjustUserUsage(
  userId: string,
  delta: number
): Promise<{ tokenUsed: number; tokenLimit: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tokenUsed: true, tokenLimit: true },
  })
  if (!user) throw new Error('User not found')
  const newUsed = Math.max(0, user.tokenUsed + delta)
  const updated = await db.user.update({
    where: { id: userId },
    data: { tokenUsed: newUsed },
    select: { tokenUsed: true, tokenLimit: true },
  })
  return updated
}
