import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { commandSchema } from '@/lib/schemas'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = commandSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const command = {
      id: uuidv4(),
      projectId: parsed.data.projectId,
      action: parsed.data.action,
      createdAt: Date.now(),
    }

    // Atualiza status para "starting" ou mantém como "stopped" enquanto aguarda agente
    if (parsed.data.action === 'start') {
      await redis.set(`project:${parsed.data.projectId}:status`, 'starting', { ex: 30 })
    }

    await redis.lpush('agent:commands:queue', JSON.stringify(command))
    return NextResponse.json({ success: true, commandId: command.id })
  } catch (error) {
    console.error('POST /api/commands error:', error)
    return NextResponse.json({ error: 'Erro ao enfileirar comando' }, { status: 500 })
  }
}
