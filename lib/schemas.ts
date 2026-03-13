import { z } from 'zod'

const str = (schema: z.ZodString) =>
  z.preprocess((val) => (val === undefined || val === null ? '' : val), schema)

export const projectSchema = z.object({
  name: str(z.string().min(1, 'Nome é obrigatório').max(100)),
  description: str(z.string().max(500)),
  localUrl: str(
    z.string().refine(
      (val) => val === '' || z.string().url().safeParse(val).success,
      'URL inválida (ex: http://localhost:3000)'
    )
  ),
  cloudUrl: str(
    z.string().refine(
      (val) => val === '' || z.string().url().safeParse(val).success,
      'URL inválida (ex: https://app.vercel.app)'
    )
  ),
  startCmd: str(z.string()),
  workingDir: str(z.string()),
})

export type ProjectInput = z.infer<typeof projectSchema>

export const commandSchema = z.object({
  projectId: z.string().min(1),
  action: z.enum(['start', 'stop']),
})
