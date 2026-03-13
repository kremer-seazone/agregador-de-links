import { NextRequest } from 'next/server'

export function validateAgentSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  return token === process.env.AGENT_SECRET
}
