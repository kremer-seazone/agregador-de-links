import { NextRequest, NextResponse } from 'next/server'
import { isValidSession, SESSION_COOKIE } from '@/lib/auth'

const PUBLIC = ['/login', '/api/agent']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next()

  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (isValidSession(token)) return NextResponse.next()

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
