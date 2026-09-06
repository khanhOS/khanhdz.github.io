import { db } from '@/lib/db'
import {
  PLAN_TOKEN_LIMITS,
  type Plan,
  formatTokens,
  isPlan,
} from '@/lib/plans'
import { isOwnerEmail } from '@/lib/auth'
import { setUserPlan, resetUserQuota, adjustUserUsage } from '@/lib/quota'
import { httpError } from '@/lib/api-response'

export interface CommandContext {
  actorId: string
  actorEmail: string
}

export interface CommandResult {
  ok: boolean
  message: string
  targetUserId?: string
}

async function findUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      id: true, email: true, role: true, plan: true,
      tokenLimit: true, tokenUsed: true, bannedAt: true, createdAt: true,
    },
  })
}

async function audit(params: {
  actorId: string
  action: string
  detail: string
  metadata?: Record<string, unknown>
  targetUserId?: string
}) {
  try {
    await db.auditLog.create({
      data: {
        actorUserId: params.actorId,
        action: params.action,
        detail: params.detail,
        metadataJson: JSON.stringify(params.metadata || {}),
        targetUserId: params.targetUserId,
      },
    })
  } catch (err) {
    console.error('[audit] failed to log:', err)
  }
}

export async function runCommand(
  rawCommand: string,
  ctx: CommandContext
): Promise<CommandResult> {
  const cmd = rawCommand.trim()
  if (!cmd) throw httpError(400, 'Lệnh trống')
  if (!cmd.startsWith('/')) throw httpError(400, 'Lệnh phải bắt đầu bằng /')

  const parts = cmd.slice(1).split(/\s+/)
  const name = (parts[0] || '').toLowerCase()
  const args = parts.slice(1)

  switch (name) {
    case 'give': return cmdGive(args, ctx)
    case 'removeplus':
    case 'removemax': return cmdRemovePlan(args, name, ctx)
    case 'setplan': return cmdSetPlan(args, ctx)
    case 'user': return cmdUser(args, ctx)
    case 'users': return cmdUsers(args, ctx)
    case 'balance': return cmdBalance(args, ctx)
    case 'addtoken': return cmdAddToken(args, ctx, +1)
    case 'removetoken': return cmdAddToken(args, ctx, -1)
    case 'ban': return cmdBan(args, ctx, true)
    case 'unban': return cmdBan(args, ctx, false)
    case 'maintenance': return cmdMaintenance(args, ctx)
    case 'resetquota': return cmdResetQuota(args, ctx)
    case 'help': return cmdHelp()
    case 'stats': return cmdStats(ctx)
    default:
      throw httpError(400, `Lệnh không xác định: /${name}. Gõ /help để xem danh sách lệnh.`)
  }
}

async function cmdGive(args: string[], ctx: CommandContext): Promise<CommandResult> {
  const planArg = (args[0] || '').toUpperCase()
  const email = args[1] || ''
  if (!isPlan(planArg)) throw httpError(400, 'Gói không hợp lệ (PLUS | MAX | FREE)')
  if (!email) throw httpError(400, 'Vui lòng nhập email')

  const user = await findUserByEmail(email)
  if (!user) throw httpError(404, 'Không tìm thấy người dùng')

  if (planArg === 'FREE') return cmdSetPlan([email, 'free'], ctx)

  await setUserPlan(user.id, planArg, { resetUsage: true })
  const detail = `/give ${planArg.toLowerCase()} ${user.email}`
  await audit({
    actorId: ctx.actorId, action: 'command.give', detail,
    metadata: { plan: planArg, before: user.plan }, targetUserId: user.id,
  })
  return {
    ok: true,
    message: `Đã cấp gói ${planArg} cho ${user.email} (quota reset về ${formatTokens(PLAN_TOKEN_LIMITS[planArg])})`,
    targetUserId: user.id,
  }
}

async function cmdRemovePlan(args: string[], name: string, ctx: CommandContext): Promise<CommandResult> {
  const email = args[0] || ''
  if (!email) throw httpError(400, 'Vui lòng nhập email')
  const user = await findUserByEmail(email)
  if (!user) throw httpError(404, 'Không tìm thấy người dùng')

  await setUserPlan(user.id, 'FREE', { resetUsage: true })
  const detail = `/${name} ${user.email}`
  await audit({
    actorId: ctx.actorId, action: `command.${name}`, detail,
    metadata: { before: user.plan }, targetUserId: user.id,
  })
  return { ok: true, message: `Đã hạ gói của ${user.email} về FREE`, targetUserId: user.id }
}

async function cmdSetPlan(args: string[], ctx: CommandContext): Promise<CommandResult> {
  const email = args[0] || ''
  const planArg = (args[1] || '').toLowerCase()
  const planMap: Record<string, Plan> = { free: 'FREE', plus: 'PLUS', max: 'MAX' }
  const plan = planMap[planArg]
  if (!plan) throw httpError(400, 'Gói không hợp lệ (free | plus | max)')
  if (!email) throw httpError(400, 'Vui lòng nhập email')

  const user = await findUserByEmail(email)
  if (!user) throw httpError(404, 'Không tìm thấy người dùng')

  await setUserPlan(user.id, plan, { resetUsage: true })
  const detail = `/setplan ${user.email} ${planArg}`
  await audit({
    actorId: ctx.actorId, action: 'command.setplan', detail,
    metadata: { plan, before: user.plan }, targetUserId: user.id,
  })
  return {
    ok: true,
    message: `Đã đặt gói ${plan} cho ${user.email} (quota reset về ${formatTokens(PLAN_TOKEN_LIMITS[plan])})`,
    targetUserId: user.id,
  }
}

async function cmdUser(args: string[], _ctx: CommandContext): Promise<CommandResult> {
  const email = args[0] || ''
  if (!email) throw httpError(400, 'Vui lòng nhập email')
  const user = await findUserByEmail(email)
  if (!user) throw httpError(404, 'Không tìm thấy người dùng')
  const status = user.bannedAt ? 'BANNED' : 'ACTIVE'
  const role = isOwnerEmail(user.email) ? 'OWNER' : user.role
  return {
    ok: true,
    message: [
      `User: ${user.email}`,
      `ID: ${user.id}`,
      `Role: ${role}`,
      `Plan: ${user.plan}`,
      `Quota: ${formatTokens(user.tokenUsed)} / ${formatTokens(user.tokenLimit)} token`,
      `Status: ${status}`,
      `Created: ${user.createdAt.toISOString()}`,
    ].join('\n'),
    targetUserId: user.id,
  }
}

async function cmdUsers(args: string[], _ctx: CommandContext): Promise<CommandResult> {
  const page = Math.max(1, parseInt(args[0] || '1', 10) || 1)
  const pageSize = 10
  const [total, users] = await Promise.all([
    db.user.count(),
    db.user.findMany({
      take: pageSize, skip: (page - 1) * pageSize, orderBy: { createdAt: 'desc' },
      select: { email: true, plan: true, role: true, tokenUsed: true, tokenLimit: true, bannedAt: true },
    }),
  ])
  const lines = users.map((u) => {
    const role = isOwnerEmail(u.email) ? 'OWNER' : u.role
    const status = u.bannedAt ? 'BANNED' : 'OK'
    return `• ${u.email} [${role}/${u.plan}/${status}] ${formatTokens(u.tokenUsed)}/${formatTokens(u.tokenLimit)}`
  })
  return {
    ok: true,
    message: `Users (page ${page}, ${total} total):\n${lines.join('\n')}`,
  }
}

async function cmdBalance(args: string[], _ctx: CommandContext): Promise<CommandResult> {
  const email = args[0] || ''
  if (!email) throw httpError(400, 'Vui lòng nhập email')
  const user = await findUserByEmail(email)
  if (!user) throw httpError(404, 'Không tìm thấy người dùng')
  return {
    ok: true,
    message: `Balance: ${user.email}\n  Plan: ${user.plan}\n  Used: ${formatTokens(user.tokenUsed)} token\n  Limit: ${formatTokens(user.tokenLimit)} token\n  Remaining: ${formatTokens(Math.max(0, user.tokenLimit - user.tokenUsed))} token`,
    targetUserId: user.id,
  }
}

async function cmdAddToken(args: string[], ctx: CommandContext, sign: 1 | -1): Promise<CommandResult> {
  const email = args[0] || ''
  const amount = parseInt(args[1] || '0', 10)
  if (!email) throw httpError(400, 'Vui lòng nhập email')
  if (!Number.isFinite(amount) || amount <= 0) throw httpError(400, 'Số lượng phải là số nguyên dương')
  const user = await findUserByEmail(email)
  if (!user) throw httpError(404, 'Không tìm thấy người dùng')

  const delta = sign * amount
  await adjustUserUsage(user.id, delta)
  const detail = `${sign > 0 ? '/addtoken' : '/removetoken'} ${user.email} ${amount}`
  await audit({
    actorId: ctx.actorId, action: sign > 0 ? 'command.addtoken' : 'command.removetoken', detail,
    metadata: { delta, before: user.tokenUsed }, targetUserId: user.id,
  })
  const updated = await db.user.findUnique({
    where: { id: user.id }, select: { tokenUsed: true, tokenLimit: true },
  })
  return {
    ok: true,
    message: `Đã ${sign > 0 ? 'thêm' : 'trừ'} ${formatTokens(amount)} token cho ${user.email}. Hiện tại: ${formatTokens(updated?.tokenUsed || 0)}/${formatTokens(updated?.tokenLimit || 0)}`,
    targetUserId: user.id,
  }
}

async function cmdBan(args: string[], ctx: CommandContext, ban: boolean): Promise<CommandResult> {
  const email = args[0] || ''
  if (!email) throw httpError(400, 'Vui lòng nhập email')
  const user = await findUserByEmail(email)
  if (!user) throw httpError(404, 'Không tìm thấy người dùng')
  if (isOwnerEmail(user.email)) throw httpError(400, 'Không thể ban Owner')

  await db.user.update({
    where: { id: user.id },
    data: { bannedAt: ban ? new Date() : null },
  })
  const detail = `${ban ? '/ban' : '/unban'} ${user.email}`
  await audit({
    actorId: ctx.actorId, action: ban ? 'command.ban' : 'command.unban', detail,
    metadata: { before: user.bannedAt }, targetUserId: user.id,
  })
  return {
    ok: true,
    message: `${ban ? 'Đã cấm' : 'Đã mở cấm'} ${user.email}`,
    targetUserId: user.id,
  }
}

async function cmdResetQuota(args: string[], ctx: CommandContext): Promise<CommandResult> {
  const email = args[0] || ''
  if (!email) throw httpError(400, 'Vui lòng nhập email')
  const user = await findUserByEmail(email)
  if (!user) throw httpError(404, 'Không tìm thấy người dùng')
  await resetUserQuota(user.id)
  const detail = `/resetquota ${user.email}`
  await audit({
    actorId: ctx.actorId, action: 'command.resetquota', detail,
    metadata: { before: user.tokenUsed }, targetUserId: user.id,
  })
  return {
    ok: true,
    message: `Đã reset quota của ${user.email} về 0/${formatTokens(user.tokenLimit)}`,
    targetUserId: user.id,
  }
}

async function cmdMaintenance(args: string[], ctx: CommandContext): Promise<CommandResult> {
  const arg = (args[0] || '').toLowerCase()
  if (arg !== 'on' && arg !== 'off') throw httpError(400, 'Cú pháp: /maintenance on|off')
  const enabled = arg === 'on'
  await db.systemSetting.upsert({
    where: { id: 'maintenance.enabled' },
    update: { value: enabled ? '1' : '0' },
    create: { id: 'maintenance.enabled', value: enabled ? '1' : '0' },
  })
  const detail = `/maintenance ${arg}`
  await audit({ actorId: ctx.actorId, action: 'command.maintenance', detail, metadata: { enabled } })
  return {
    ok: true,
    message: `Chế độ bảo trì ${enabled ? 'BẬT' : 'TẮT'}${enabled ? ' — user không thể gửi yêu cầu AI mới.' : ''}`,
  }
}

function cmdHelp(): CommandResult {
  const lines = [
    'KhanhOS AI — Owner Commands:',
    '  /give plus <email>        Cấp PLUS (reset quota 80k)',
    '  /give max <email>         Cấp MAX (reset quota 200k)',
    '  /give free <email>        Hạ về FREE (reset quota 20k)',
    '  /setplan <email> <plan>   Đặt gói (free|plus|max)',
    '  /removeplus <email>       Hạ PLUS về FREE',
    '  /removemax <email>        Hạ MAX về FREE',
    '  /user <email>             Xem thông tin user',
    '  /users [page]             Danh sách user',
    '  /balance <email>          Xem quota',
    '  /addtoken <email> <n>     Thêm token',
    '  /removetoken <email> <n>  Trừ token',
    '  /ban <email>              Cấm user',
    '  /unban <email>            Mở cấm',
    '  /resetquota <email>       Reset quota về 0',
    '  /maintenance on|off       Bật/tắt bảo trì',
    '  /stats                    Thống kê tổng quan',
  ]
  return { ok: true, message: lines.join('\n') }
}

async function cmdStats(_ctx: CommandContext): Promise<CommandResult> {
  const [total, plus, max, free, banned] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { plan: 'PLUS' } }),
    db.user.count({ where: { plan: 'MAX' } }),
    db.user.count({ where: { plan: 'FREE' } }),
    db.user.count({ where: { NOT: { bannedAt: null } } }),
  ])
  const pendingPayments = await db.payment.count({ where: { status: 'PENDING' } })
  const aiRequests = await db.usage.count()
  return {
    ok: true,
    message: [
      'Stats:',
      `  Total users:  ${total}`,
      `  FREE:         ${free}`,
      `  PLUS:         ${plus}`,
      `  MAX:          ${max}`,
      `  Banned:       ${banned}`,
      `  AI requests:  ${aiRequests}`,
      `  Pending pays: ${pendingPayments}`,
    ].join('\n'),
  }
}
