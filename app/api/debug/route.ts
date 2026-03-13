import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { Redis } = await import('@upstash/redis')
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) return NextResponse.json({ error: 'env vars missing', url: !!url, token: !!token })
    const r = new Redis({ url, token })
    const result = await r.ping()
    return NextResponse.json({ ok: true, ping: result })
  } catch (err) {
    return NextResponse.json({ error: String(err) })
  }
}
