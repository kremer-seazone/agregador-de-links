import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { validateAgentSecret } from '@/lib/auth'

// Agente faz poll aqui para buscar comandos pendentes
export async function GET(request: NextRequest) {
  if (!validateAgentSecret(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Pega até 5 comandos da fila de uma vez
    const commands = []
    for (let i = 0; i < 5; i++) {
      const raw = await redis.rpop('agent:commands:queue')
      if (!raw) break
      commands.push(typeof raw === 'string' ? JSON.parse(raw) : raw)
    }

    return NextResponse.json(commands)
  } catch (error) {
    console.error('GET /api/agent/commands error:', error)
    return NextResponse.json({ error: 'Erro ao buscar comandos' }, { status: 500 })
  }
}
