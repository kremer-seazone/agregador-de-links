import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (!process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: 'Servidor não configurado' }, { status: 500 })
  }

  if (password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, process.env.DASHBOARD_PASSWORD, sessionCookieOptions())
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 })
  return response
}
