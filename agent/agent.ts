import 'dotenv/config'
import { startProcess, stopProcess, isRunning } from './process-manager.js'

const API_URL = process.env.API_URL
const AGENT_SECRET = process.env.AGENT_SECRET
const POLL_INTERVAL_MS = 5_000

if (!API_URL || !AGENT_SECRET) {
  console.error('[agent] API_URL e AGENT_SECRET são obrigatórios no .env')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${AGENT_SECRET}`,
  'Content-Type': 'application/json',
}

async function reportStatus(projectId: string, status: 'running' | 'stopped' | 'starting' | 'error') {
  try {
    await fetch(`${API_URL}/api/agent/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, status }),
    })
  } catch (err) {
    console.error('[agent] Erro ao reportar status:', err)
  }
}

async function fetchProjectDetails(projectId: string): Promise<{ startCmd: string; workingDir: string } | null> {
  try {
    const res = await fetch(`${API_URL}/api/projects/${projectId}`, { headers })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function poll() {
  try {
    const res = await fetch(`${API_URL}/api/agent/commands`, { headers })
    if (!res.ok) {
      console.error(`[agent] Poll retornou ${res.status}`)
      return
    }

    const commands: Array<{ id: string; projectId: string; action: 'start' | 'stop' }> = await res.json()

    for (const cmd of commands) {
      console.log(`[agent] Comando recebido: ${cmd.action} para projeto ${cmd.projectId}`)

      if (cmd.action === 'start') {
        if (isRunning(cmd.projectId)) {
          await reportStatus(cmd.projectId, 'running')
          continue
        }

        const project = await fetchProjectDetails(cmd.projectId)
        if (!project) {
          console.error(`[agent] Projeto ${cmd.projectId} não encontrado`)
          await reportStatus(cmd.projectId, 'error')
          continue
        }

        if (!project.startCmd || !project.workingDir) {
          console.error(`[agent] Projeto ${cmd.projectId} não tem startCmd/workingDir configurados`)
          await reportStatus(cmd.projectId, 'error')
          continue
        }

        await reportStatus(cmd.projectId, 'starting')
        try {
          await startProcess(cmd.projectId, project.startCmd, project.workingDir)
          await reportStatus(cmd.projectId, 'running')
        } catch (err) {
          console.error(`[agent] Erro ao iniciar ${cmd.projectId}:`, err)
          await reportStatus(cmd.projectId, 'error')
        }
      } else if (cmd.action === 'stop') {
        stopProcess(cmd.projectId)
        await reportStatus(cmd.projectId, 'stopped')
      }
    }
  } catch (err) {
    console.error('[agent] Erro no poll:', err)
  }
}

console.log(`[agent] Iniciado. Polling ${API_URL} a cada ${POLL_INTERVAL_MS / 1000}s`)
setInterval(poll, POLL_INTERVAL_MS)
poll() // executa imediatamente
