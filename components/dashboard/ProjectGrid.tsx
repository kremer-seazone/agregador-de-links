'use client'

import { useState } from 'react'
import { ProjectWithStatus } from '@/types'
import { ProjectInput } from '@/lib/schemas'
import { ProjectCard } from './ProjectCard'
import { ProjectModal } from '@/components/modals/ProjectModal'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface ProjectGridProps {
  projects: ProjectWithStatus[]
}

export function ProjectGrid({ projects: initialProjects }: ProjectGridProps) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectWithStatus | undefined>()

  async function handleSave(data: ProjectInput) {
    if (editingProject) {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const updated = await res.json()
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? { ...updated, status: p.status } : p))
      )
    } else {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const created = await res.json()
      setProjects((prev) => [{ ...created, status: 'stopped' as const }, ...prev])
    }
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    setProjects((prev) => prev.filter((p) => p.id !== id))
    router.refresh()
  }

  function openEdit(project: ProjectWithStatus) {
    setEditingProject(project)
    setModalOpen(true)
  }

  function openNew() {
    setEditingProject(undefined)
    setModalOpen(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Projetos</h2>
        <Button onClick={openNew}>+ Novo Projeto</Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">Nenhum projeto cadastrado.</p>
          <p className="text-sm mt-1">Clique em &quot;+ Novo Projeto&quot; para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        project={editingProject}
      />
    </div>
  )
}
