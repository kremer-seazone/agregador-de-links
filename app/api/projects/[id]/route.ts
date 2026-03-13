import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { projectSchema } from '@/lib/schemas'
import { Project } from '@/types'

interface RouteParams {
  params: { id: string }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const data = await redis.hgetall(`project:${params.id}`)
    if (!data) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    return NextResponse.json({ id: params.id, ...data })
  } catch (error) {
    console.error('GET /api/projects/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao buscar projeto' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const exists = await redis.exists(`project:${params.id}`)
    if (!exists) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })

    const body = await request.json()
    const parsed = projectSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    await redis.hset(`project:${params.id}`, parsed.data)
    const project: Project = { id: params.id, ...parsed.data }
    return NextResponse.json(project)
  } catch (error) {
    console.error('PUT /api/projects/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar projeto' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const exists = await redis.exists(`project:${params.id}`)
    if (!exists) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })

    await Promise.all([
      redis.del(`project:${params.id}`),
      redis.zrem('projects:index', params.id),
      redis.del(`project:${params.id}:status`),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/projects/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao deletar projeto' }, { status: 500 })
  }
}
