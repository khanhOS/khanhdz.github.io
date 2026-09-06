import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import type { Role } from '@/lib/plans'

export const OWNER_EMAIL = (process.env.OWNER_EMAIL || '').trim().toLowerCase()

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.trim().toLowerCase() === OWNER_EMAIL
}

export function resolveRole(user: { email: string; role: string }): Role {
  if (isOwnerEmail(user.email)) return 'OWNER'
  if (user.role === 'OWNER' || user.role === 'ADMIN' || user.role === 'USER') {
    if (user.role === 'OWNER' && !isOwnerEmail(user.email)) return 'USER'
    return user.role
  }
  return 'USER'
}

export function isAdmin(role: Role): boolean {
  return role === 'ADMIN' || role === 'OWNER'
}
export function isOwner(role: Role): boolean {
  return role === 'OWNER'
}

// Scrypt password hashing (Node built-in, no external deps)
export async function hashPassword(password: string): Promise<string> {
  const crypto = await import('node:crypto')
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const crypto = await import('node:crypto')
    if (stored.startsWith('scrypt$')) {
      const [, salt, hash] = stored.split('$')
      if (!salt || !hash) return false
      const testHash = crypto.scryptSync(password, salt, 64).toString('hex')
      return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(hash, 'hex'))
    }
    return false
  } catch {
    return false
  }
}

// JWT session via jose (already in deps via next-auth)
const SESSION_COOKIE = 'khanhos_session'

interface SessionPayload {
  sub: string
  email: string
  iat: number
  exp: number
}

async function getJwtSecret(): Promise<Uint8Array> {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET missing or too short. Set a strong random secret (>=32 chars) in .env')
  }
  return new TextEncoder().encode(secret)
}

export async function createSession(userId: string, email: string, remember = false): Promise<void> {
  const { SignJWT } = await import('jose')
  const secret = await getJwtSecret()
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24
  const now = Math.floor(Date.now() / 1000)
  const token = await new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + maxAge)
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null
    const { jwtVerify } = await import('jose')
    const secret = await getJwtSecret()
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export interface AuthUser {
  id: string
  email: string
  role: Role
  plan: 'FREE' | 'PLUS' | 'MAX'
  tokenLimit: number
  tokenUsed: number
  bannedAt: Date | null
  approved: boolean
  createdAt: Date
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession()
  if (!session?.sub) return null
  try {
    const user = await db.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true, email: true, role: true, plan: true,
        tokenLimit: true, tokenUsed: true, bannedAt: true,
        approved: true, createdAt: true,
      },
    })
    if (!user) return null
    if (user.bannedAt) return null
    const role = resolveRole(user)
    // Whitelist: OWNER auto-approved, others need approved=true
    if (role !== 'OWNER' && !user.approved) return null
    return {
      ...user,
      role,
      plan: user.plan as 'FREE' | 'PLUS' | 'MAX',
    }
  } catch (err) {
    console.error('[auth] getCurrentUser error:', err)
    return null
  }
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    const err = new Error('UNAUTHORIZED'); (err as any).statusCode = 401; throw err
  }
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser()
  if (!isAdmin(user.role)) {
    const err = new Error('FORBIDDEN'); (err as any).statusCode = 403; throw err
  }
  return user
}

export async function requireOwner(): Promise<AuthUser> {
  const user = await requireUser()
  if (!isOwner(user.role)) {
    const err = new Error('FORBIDDEN'); (err as any).statusCode = 403; throw err
  }
  return user
}
