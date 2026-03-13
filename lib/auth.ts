import { NextRequest } from 'next/server'
import { createHash } from 'crypto'

export function validateAgentSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  return token === process.env.AGENT_SECRET
}

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export function isValidSession(token: string | undefined): boolean {
  if (!token || !process.env.DASHBOARD_PASSWORD) return false
  return token === hashPassword(process.env.DASHBOARD_PASSWORD)
}

export const SESSION_COOKIE = 'session'

export function sessionCookieOptions(maxAge = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}
