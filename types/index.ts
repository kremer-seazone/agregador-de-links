export type ProjectStatus = 'running' | 'stopped' | 'starting' | 'error'

export interface Project {
  id: string
  name: string
  description: string
  localUrl: string
  cloudUrl: string
  startCmd: string
  workingDir: string
}

export interface ProjectWithStatus extends Project {
  status: ProjectStatus
}

export interface AgentCommand {
  id: string
  projectId: string
  action: 'start' | 'stop'
  createdAt: number
}
