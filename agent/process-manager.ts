import { spawn, ChildProcess } from 'node:child_process'

interface ManagedProcess {
  pid: number
  process: ChildProcess
  projectId: string
}

const processes = new Map<string, ManagedProcess>()

export async function startProcess(projectId: string, cmd: string, workingDir: string): Promise<void> {
  if (processes.has(projectId)) {
    console.log(`[agent] Projeto ${projectId} já está rodando, ignorando start`)
    return
  }

  const [command, ...args] = cmd.split(' ')
  const child = spawn(command, args, {
    cwd: workingDir,
    detached: false,
    stdio: 'pipe',
    shell: true,
  })

  child.stdout?.on('data', (data) => {
    console.log(`[${projectId}] stdout: ${data.toString().trim()}`)
  })

  child.stderr?.on('data', (data) => {
    console.error(`[${projectId}] stderr: ${data.toString().trim()}`)
  })

  child.on('exit', (code) => {
    console.log(`[agent] Processo ${projectId} encerrado com código ${code}`)
    processes.delete(projectId)
  })

  if (child.pid === undefined) {
    throw new Error(`Falha ao iniciar processo para ${projectId}`)
  }

  processes.set(projectId, { pid: child.pid, process: child, projectId })
  console.log(`[agent] Processo ${projectId} iniciado (PID ${child.pid})`)
}

export function stopProcess(projectId: string): void {
  const managed = processes.get(projectId)
  if (!managed) {
    console.log(`[agent] Projeto ${projectId} não está rodando`)
    return
  }

  managed.process.kill('SIGTERM')
  processes.delete(projectId)
  console.log(`[agent] Processo ${projectId} parado`)
}

export function isRunning(projectId: string): boolean {
  return processes.has(projectId)
}

export function getRunningProjects(): string[] {
  return Array.from(processes.keys())
}
