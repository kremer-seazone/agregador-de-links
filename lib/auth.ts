import { NextRequest } from 'next/server'

export function validateAgentSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  return token === process.env.AGENT_SECRET?.trim()
}

// Cookie armazena a senha diretamente (httpOnly + Secure + SameSite protege)
// Evita usar Node.js crypto que não roda no Edge Runtime do middleware
export function isValidSession(token: string | undefined): boolean {
  if (!token || !process.env.DASHBOARD_PASSWORD) return false
  return token === process.env.DASHBOARD_PASSWORD
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
