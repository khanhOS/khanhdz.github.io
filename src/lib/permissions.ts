import type { Role } from '@/lib/plans'

export {
  OWNER_EMAIL,
  isOwnerEmail,
  resolveRole,
  isAdmin,
  isOwner,
  getCurrentUser,
  requireUser,
  requireAdmin,
  requireOwner,
} from '@/lib/auth'

export const PERMISSIONS = {
  CHAT: ['USER', 'ADMIN', 'OWNER'],
  VIEW_OWN_CONVERSATIONS: ['USER', 'ADMIN', 'OWNER'],
  VIEW_OWN_SETTINGS: ['USER', 'ADMIN', 'OWNER'],
  VIEW_OWN_ACCOUNT: ['USER', 'ADMIN', 'OWNER'],
  REQUEST_CHECKOUT: ['USER', 'ADMIN', 'OWNER'],
  VIEW_OWNER_PANEL: ['ADMIN', 'OWNER'],
  RUN_COMMANDS: ['OWNER'],
  APPROVE_PAYMENTS: ['OWNER'],
  VIEW_ALL_USERS: ['ADMIN', 'OWNER'],
  VIEW_AUDIT_LOGS: ['ADMIN', 'OWNER'],
  TOGGLE_MAINTENANCE: ['OWNER'],
} as const

export function can(role: Role, permission: keyof typeof PERMISSIONS): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role)
}
