import { db } from '@/lib/db'
import { requireOwner } from '@/lib/auth'
import { runCommand } from '@/lib/commands'
import { ownerCommandSchema } from '@/lib/validation'
import { ok, fail, failValidation, withErrors, httpError } from '@/lib/api-response'

export const POST = withErrors(async (request: Request) => {
  const owner = await requireOwner()
  const body = await request.json().catch(() => ({}))
  const parsed = ownerCommandSchema.safeParse(body)
  if (!parsed.success) return failValidation(parsed.error)

  const result = await runCommand(parsed.data.command, {
    actorId: owner.id,
    actorEmail: owner.email,
  })

  return ok({
    ok: result.ok, message: result.message, targetUserId: result.targetUserId,
  })
})

export const GET = withErrors(async () => {
  await requireOwner()
  return ok({
    commands: [
      { cmd: '/give plus <email>', desc: 'Cấp gói PLUS (reset quota 80k)' },
      { cmd: '/give max <email>', desc: 'Cấp gói MAX (reset quota 200k)' },
      { cmd: '/give free <email>', desc: 'Hạ về gói FREE' },
      { cmd: '/setplan <email> <free|plus|max>', desc: 'Đặt gói cụ thể' },
      { cmd: '/removeplus <email>', desc: 'Hạ PLUS về FREE' },
      { cmd: '/removemax <email>', desc: 'Hạ MAX về FREE' },
      { cmd: '/user <email>', desc: 'Xem thông tin user' },
      { cmd: '/users [page]', desc: 'Danh sách user' },
      { cmd: '/balance <email>', desc: 'Xem quota' },
      { cmd: '/addtoken <email> <n>', desc: 'Thêm token' },
      { cmd: '/removetoken <email> <n>', desc: 'Trừ token' },
      { cmd: '/ban <email>', desc: 'Cấm user' },
      { cmd: '/unban <email>', desc: 'Mở cấm' },
      { cmd: '/resetquota <email>', desc: 'Reset quota' },
      { cmd: '/maintenance on|off', desc: 'Bật/tắt bảo trì' },
      { cmd: '/stats', desc: 'Thống kê tổng quan' },
      { cmd: '/help', desc: 'Hiển thị danh sách lệnh' },
    ],
  })
})
