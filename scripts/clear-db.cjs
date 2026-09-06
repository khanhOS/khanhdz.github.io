// Clear all users in DB (for fresh restart)
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()
async function main() {
  // Manual cascade delete
  const users = await db.user.findMany({ select: { id: true } })
  for (const u of users) {
    await db.passwordResetToken.deleteMany({ where: { userId: u.id } }).catch(() => {})
    await db.payment.deleteMany({ where: { userId: u.id } }).catch(() => {})
    await db.usage.deleteMany({ where: { userId: u.id } }).catch(() => {})
    await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: u.id }, { targetUserId: u.id }] } }).catch(() => {})
    const convs = await db.conversation.findMany({ where: { userId: u.id }, select: { id: true } }).catch(() => [])
    for (const c of convs) {
      await db.message.deleteMany({ where: { conversationId: c.id } }).catch(() => {})
    }
    await db.conversation.deleteMany({ where: { userId: u.id } }).catch(() => {})
    await db.user.delete({ where: { id: u.id } }).catch(() => {})
  }
  console.log(`Cleared ${users.length} users`)
  await db.systemSetting.deleteMany().catch(() => {})
  console.log('Cleared system settings')
}
main().finally(() => db.$disconnect())
