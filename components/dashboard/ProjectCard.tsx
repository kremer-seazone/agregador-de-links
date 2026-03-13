'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProjectWithStatus, ProjectStatus } from '@/types'

interface ProjectCardProps {
  project: ProjectWithStatus
  onEdit: (project: ProjectWithStatus) => void
  onDelete: (id: string) => void
}

const statusColors: Record<ProjectStatus, string> = {
  running: 'bg-green-500',
  stopped: 'bg-gray-400',
  starting: 'bg-yellow-500',
  error: 'bg-red-500',
}

const statusLabels: Record<ProjectStatus, string> = {
  running: 'Rodando',
  stopped: 'Parado',
  starting: 'Iniciando',
  error: 'Erro',
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const [status, setStatus] = useState<ProjectStatus>(project.status)
  const [loading, setLoading] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}`)
      if (!res.ok) return
      // status vem de outra rota dedicada
      const statusRes = await fetch(`/api/projects/${project.id}/status`)
      if (!statusRes.ok) return
      const data = await statusRes.json()
      setStatus(data.status)
    } catch {
      // silencia erro de rede
    }
  }, [project.id])

  useEffect(() => {
    const interval = setInterval(fetchStatus, 10_000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  async function sendCommand(action: 'start' | 'stop') {
    setLoading(true)
    try {
      await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, action }),
      })
      if (action === 'start') setStatus('starting')
      else setStatus('stopped')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <Badge className={`${statusColors[status]} text-white border-0`}>
            {statusLabels[status]}
          </Badge>
        </div>
        {project.description && (
          <CardDescription>{project.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
        {project.localUrl && (
          <div>
            <span className="font-medium text-foreground">Local: </span>
            <a href={project.localUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
              {project.localUrl}
            </a>
          </div>
        )}
        {project.cloudUrl && (
          <div>
            <span className="font-medium text-foreground">Cloud: </span>
            <a href={project.cloudUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
              {project.cloudUrl}
            </a>
          </div>
        )}
        <div>
          <span className="font-medium text-foreground">Cmd: </span>
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{project.startCmd}</code>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-4">
        {status === 'running' || status === 'starting' ? (
          <Button size="sm" variant="destructive" onClick={() => sendCommand('stop')} disabled={loading}>
            Parar
          </Button>
        ) : (
          <Button size="sm" onClick={() => sendCommand('start')} disabled={loading}>
            Iniciar
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => onEdit(project)}>
          Editar
        </Button>
        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 ml-auto" onClick={() => onDelete(project.id)}>
          Excluir
        </Button>
      </CardFooter>
    </Card>
  )
}
