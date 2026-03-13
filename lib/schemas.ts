import { z } from 'zod'

export const projectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().max(500),
  localUrl: z.string().url('URL local inválida').or(z.literal('')),
  cloudUrl: z.string().url('URL cloud inválida').or(z.literal('')),
  startCmd: z.string().min(1, 'Comando de start é obrigatório'),
  workingDir: z.string().min(1, 'Diretório de trabalho é obrigatório'),
})

export type ProjectInput = z.infer<typeof projectSchema>

export const commandSchema = z.object({
  projectId: z.string().min(1),
  action: z.enum(['start', 'stop']),
})
