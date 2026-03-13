import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { projectSchema } from '@/lib/schemas'
import { Project } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    const ids = await redis.zrange('projects:index', 0, -1, { rev: true })
    if (!ids.length) return NextResponse.json([])

    const projects = await Promise.all(
      ids.map(async (id) => {
        const project = await redis.hgetall(`project:${id}`)
        return project ? { id, ...project } : null
      })
    )

    return NextResponse.json(projects.filter(Boolean))
  } catch (error) {
    console.error('GET /api/projects error:', error)
    return NextResponse.json({ error: 'Erro ao listar projetos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    console.error('POST /api/projects error:', error)
    return NextResponse.json({ error: 'Erro ao criar projeto' }, { status: 500 })
  }
}
