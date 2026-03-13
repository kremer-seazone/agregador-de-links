'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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

interface FormValues {
  name: string
  description: string
  localUrl: string
  cloudUrl: string
  startCmd: string
  workingDir: string
}

interface ProjectModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: FormValues) => Promise<void>
  project?: Project
}

export function ProjectModal({ open, onClose, onSave, project }: ProjectModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>()

  useEffect(() => {
    if (open) {
      reset({
        name: project?.name ?? '',
        description: project?.description ?? '',
        localUrl: project?.localUrl ?? '',
        cloudUrl: project?.cloudUrl ?? '',
        startCmd: project?.startCmd ?? '',
        workingDir: project?.workingDir ?? '',
      })
    }
  }, [open, project, reset])

  async function onSubmit(data: FormValues) {
    await onSave(data)
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
            <Input
              id="name"
              {...register('name', { required: 'Nome é obrigatório' })}
              placeholder="meu-projeto"
            />
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
            </div>
            <div className="space-y-1">
              <Label htmlFor="cloudUrl">URL Cloud</Label>
              <Input id="cloudUrl" {...register('cloudUrl')} placeholder="https://app.vercel.app" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="startCmd">
              Comando de Start{' '}
              <span className="text-muted-foreground text-xs">(necessário para iniciar localmente)</span>
            </Label>
            <Input id="startCmd" {...register('startCmd')} placeholder="npm run dev" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="workingDir">
              Diretório de Trabalho{' '}
              <span className="text-muted-foreground text-xs">(necessário para iniciar localmente)</span>
            </Label>
            <Input id="workingDir" {...register('workingDir')} placeholder="/home/user/meu-projeto" />
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
