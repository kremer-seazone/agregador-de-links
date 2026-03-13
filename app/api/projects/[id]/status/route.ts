import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

interface RouteParams {
  params: { id: string }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const status = await redis.get(`project:${params.id}:status`)
    return NextResponse.json({ status: status ?? 'stopped' })
  } catch (error) {
    console.error('GET /api/projects/[id]/status error:', error)
    return NextResponse.json({ error: 'Erro ao buscar status' }, { status: 500 })
  }
}
