'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectSchema, ProjectInput } from '@/lib/schemas'
import { Project } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProjectModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: ProjectInput) => Promise<void>
  project?: Project
}

export function ProjectModal({ open, onClose, onSave, project }: ProjectModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: project ?? {
      name: '',
      description: '',
      localUrl: '',
      cloudUrl: '',
      startCmd: '',
      workingDir: '',
    },
  })

  async function onSubmit(data: ProjectInput) {
    await onSave(data)
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" {...register('name')} placeholder="meu-projeto" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" {...register('description')} placeholder="Descrição opcional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="localUrl">URL Local</Label>
              <Input id="localUrl" {...register('localUrl')} placeholder="http://localhost:3000" />
              {errors.localUrl && <p className="text-xs text-red-500">{errors.localUrl.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="cloudUrl">URL Cloud</Label>
              <Input id="cloudUrl" {...register('cloudUrl')} placeholder="https://app.vercel.app" />
              {errors.cloudUrl && <p className="text-xs text-red-500">{errors.cloudUrl.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="startCmd">Comando de Start *</Label>
            <Input id="startCmd" {...register('startCmd')} placeholder="npm run dev" />
            {errors.startCmd && <p className="text-xs text-red-500">{errors.startCmd.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="workingDir">Diretório de Trabalho *</Label>
            <Input id="workingDir" {...register('workingDir')} placeholder="/home/user/meu-projeto" />
            {errors.workingDir && <p className="text-xs text-red-500">{errors.workingDir.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
