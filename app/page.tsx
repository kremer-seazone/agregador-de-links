import { redis } from '@/lib/redis'
import { ProjectGrid } from '@/components/dashboard/ProjectGrid'
import { ProjectWithStatus } from '@/types'

async function getProjects(): Promise<ProjectWithStatus[]> {
  try {
    const ids = await redis.zrange('projects:index', 0, -1, { rev: true })
    if (!ids.length) return []

    const projects = await Promise.all(
      ids.map(async (id) => {
        const [data, status] = await Promise.all([
          redis.hgetall(`project:${id}`),
          redis.get(`project:${id}:status`),
        ])
        if (!data) return null
        return {
          id: id as string,
          ...(data as Record<string, string>),
          status: (status ?? 'stopped') as ProjectWithStatus['status'],
        } as ProjectWithStatus
      })
    )

    return projects.filter(Boolean) as ProjectWithStatus[]
  } catch {
    return []
  }
}

export default async function Home() {
  const projects = await getProjects()

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold">Agregador de Links</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie e inicie seus projetos locais</p>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProjectGrid projects={projects} />
      </div>
    </main>
  )
}
