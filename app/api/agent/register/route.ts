import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { projectSchema } from '@/lib/schemas'
import { validateAgentSecret } from '@/lib/auth'
import { Project } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  if (!validateAgentSecret(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = projectSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const id = uuidv4()
    const project: Project = { id, ...parsed.data }
    const now = Date.now()

    await redis.hset(`project:${id}`, parsed.data)
    await redis.zadd('projects:index', { score: now, member: id })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('POST /api/agent/register error:', error)
    return NextResponse.json({ error: 'Erro ao registrar projeto' }, { status: 500 })
  }
}
