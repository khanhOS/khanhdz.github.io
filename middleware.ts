import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/chat', '/settings', '/account', '/owner']
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']
const PENDING_PATH = '/pending-approval'
const SESSION_COOKIE = 'khanhos_session'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hasSession = !!request.cookies.get(SESSION_COOKIE)?.value

  if (pathname.startsWith('/api/')) return NextResponse.next()
  if (pathname === PENDING_PATH) return NextResponse.next()

  // Redirect logged-in users away from auth pages → /chat (unless they came via ?next=)
  if (
    AUTH_PATHS.some((p) => pathname.startsWith(p)) &&
    hasSession &&
    !search.includes('next=')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/chat'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p)) && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(pathname)}`
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/chat/:path*', '/settings/:path*', '/account/:path*', '/owner/:path*',
    '/login', '/register', '/forgot-password', '/reset-password', '/pending-approval',
  ],
}
