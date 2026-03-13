import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { validateAgentSecret } from '@/lib/auth'
import { z } from 'zod'

const statusSchema = z.object({
  projectId: z.string().min(1),
  status: z.enum(['running', 'stopped', 'starting', 'error']),
})

// Agente reporta status de um processo
export async function POST(request: NextRequest) {
  if (!validateAgentSecret(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = statusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    await redis.set(`project:${parsed.data.projectId}:status`, parsed.data.status, { ex: 30 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/agent/status error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
  }
}
