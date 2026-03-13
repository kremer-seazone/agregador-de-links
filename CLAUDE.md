# agregador-de-links — Contexto do Projeto

## Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS v3 + shadcn/ui (estilo padrão com CSS variables HSL)
- Upstash Redis via `@upstash/redis`
- `zod`, `uuid`, `react-hook-form`, `@hookform/resolvers`
- Agente local: Node.js + `tsx` + `dotenv`

## Objetivo
Dashboard para gerenciar projetos locais de desenvolvimento: cadastrar projetos com URL, comando de start e diretório. Um agente local (pm2/node) faz polling à API e executa os comandos, reportando o status.

## Arquitetura
- `app/` — Next.js App Router (Server Components + API Routes)
- `components/` — Client Components (ProjectCard, ProjectGrid, ProjectModal)
- `lib/` — redis.ts (cliente lazy), auth.ts (validação AGENT_SECRET), schemas.ts (Zod)
- `types/` — tipos compartilhados
- `agent/` — agente Node.js independente (package.json próprio)

## Redis Schema
- `project:{id}` → Hash (campos do projeto)
- `projects:index` → ZSet<id, timestamp>
- `project:{id}:status` → String com TTL 30s
- `agent:commands:queue` → List FIFO (LPUSH + RPOP)

## Convenções
- Commits: conventional commits (feat:, fix:, refactor:)
- Idioma: português brasileiro

## Regras do Projeto
- **Redis lazy**: usar Proxy em `lib/redis.ts` para não jogar erro no import (build falha se env vars não estiverem definidas)
- **Tailwind v3**: globals.css usa HSL vars (`hsl(var(--border))`), NÃO `oklch` nem `@import "tw-animate-css"`
- **shadcn init** com `shadcn@latest` instala estilo `base-nova` (Tailwind v4); sempre substituir globals.css e tailwind.config.ts pelo padrão v3 após o init
- **AGENT_SECRET** nunca commitado; sempre via env var
- Agente local tem package.json independente em `agent/`
