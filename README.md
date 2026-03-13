# agregador-de-links

Dashboard web para gerenciar e iniciar projetos locais remotamente, usando Next.js + Upstash Redis + agente local em Node.js.

## Arquitetura

```
[Browser] ←→ [Next.js no Vercel] ←→ [Upstash Redis]
                                            ↑
                               [Agente Local (Node.js/pm2)]
                               polls a cada 5s, executa cmds
```

O agente local faz **polling** à API (nunca recebe conexões). Funciona atrás de NAT/firewall.

## Stack

- **Frontend/API**: Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui
- **Banco**: Upstash Redis (REST API)
- **Agente local**: Node.js + tsx

## Como rodar

### 1. Pré-requisitos

- Conta no [Upstash](https://upstash.com/) com um banco Redis criado
- Node.js 20+

### 2. Configurar env vars

```bash
cp .env.example .env.local
# Preencha UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN e AGENT_SECRET
```

Gere o `AGENT_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Rodar em desenvolvimento

```bash
npm install
npm run dev
```

### 4. Instalar e rodar o agente local

```bash
cd agent
npm install
cp .env.example .env
# Preencha API_URL e AGENT_SECRET no agent/.env

# Rodar diretamente:
npm run dev

# Ou com pm2:
npx pm2 start ecosystem.config.js
```

### 5. Deploy no Vercel

1. Faça push para GitHub
2. Importe no Vercel
3. Configure as env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `AGENT_SECRET`
4. Atualize `API_URL` no `agent/.env` com a URL do Vercel

## Verificação

Após clicar **Iniciar** no dashboard, o agente deve logar:
```
[agent] Comando recebido: start para projeto <id>
```
