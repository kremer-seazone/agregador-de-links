#!/usr/bin/env bash
# register-project — registra um projeto no Agregador de Links
#
# Uso:
#   register-project [--name "Nome"] [--local URL] [--cloud URL] [--cmd "npm run dev"] [--dir PATH] [--desc "Descrição"]
#
# Variáveis de ambiente necessárias (ou em ~/.agregador):
#   AGREGADOR_URL   URL do dashboard  (ex: https://meu-agregador.vercel.app)
#   AGENT_SECRET    Token do agente
#
# Exemplos:
#   register-project --name "Meu App" --local http://localhost:3000 --cloud https://app.vercel.app
#   register-project --local http://localhost:8080  # usa nome da pasta atual

set -euo pipefail

# ── Carrega variáveis de ~/.agregador se existir ──────────────────────────────
CONFIG_FILE="$HOME/.agregador"
if [[ -f "$CONFIG_FILE" ]]; then
  # shellcheck source=/dev/null
  source "$CONFIG_FILE"
fi

# ── Parse dos argumentos ──────────────────────────────────────────────────────
NAME=""
LOCAL_URL=""
CLOUD_URL=""
START_CMD=""
WORKING_DIR=""
DESCRIPTION=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)    NAME="$2";        shift 2 ;;
    --local)   LOCAL_URL="$2";   shift 2 ;;
    --cloud)   CLOUD_URL="$2";   shift 2 ;;
    --cmd)     START_CMD="$2";   shift 2 ;;
    --dir)     WORKING_DIR="$2"; shift 2 ;;
    --desc)    DESCRIPTION="$2"; shift 2 ;;
    *) echo "Opção desconhecida: $1"; exit 1 ;;
  esac
done

# ── Defaults inteligentes ─────────────────────────────────────────────────────
# Nome: usa nome da pasta atual se não informado
if [[ -z "$NAME" ]]; then
  NAME="$(basename "$(pwd)")"
fi

# Diretório: usa pasta atual se não informado
if [[ -z "$WORKING_DIR" ]]; then
  WORKING_DIR="$(pwd)"
fi

# Comando: tenta detectar pelo package.json
if [[ -z "$START_CMD" && -f "package.json" ]]; then
  if command -v node &>/dev/null; then
    DEV_SCRIPT=$(node -e "
      try {
        const p = require('./package.json');
        const s = p.scripts || {};
        console.log(s.dev || s.start || '');
      } catch { console.log(''); }
    " 2>/dev/null || true)
    if [[ -n "$DEV_SCRIPT" ]]; then
      START_CMD="npm run $(node -e "
        try {
          const p = require('./package.json');
          const s = p.scripts || {};
          console.log(s.dev ? 'dev' : s.start ? 'start' : '');
        } catch { console.log(''); }
      " 2>/dev/null)"
    fi
  fi
fi

# ── Validação ─────────────────────────────────────────────────────────────────
if [[ -z "${AGREGADOR_URL:-}" ]]; then
  echo "Erro: AGREGADOR_URL não definida."
  echo "Defina em ~/.agregador ou como variável de ambiente:"
  echo "  export AGREGADOR_URL=https://meu-agregador.vercel.app"
  exit 1
fi

if [[ -z "${AGENT_SECRET:-}" ]]; then
  echo "Erro: AGENT_SECRET não definida."
  echo "Defina em ~/.agregador ou como variável de ambiente:"
  echo "  export AGENT_SECRET=seu-token"
  exit 1
fi

if [[ -z "$LOCAL_URL" && -z "$CLOUD_URL" ]]; then
  echo "Aviso: nenhuma URL informada. Use --local ou --cloud."
fi

# ── Monta o payload JSON ──────────────────────────────────────────────────────
PAYLOAD=$(printf '{
  "name": %s,
  "description": %s,
  "localUrl": %s,
  "cloudUrl": %s,
  "startCmd": %s,
  "workingDir": %s
}' \
  "$(echo "$NAME"        | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().rstrip()))')" \
  "$(echo "$DESCRIPTION" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().rstrip()))')" \
  "$(echo "$LOCAL_URL"   | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().rstrip()))')" \
  "$(echo "$CLOUD_URL"   | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().rstrip()))')" \
  "$(echo "$START_CMD"   | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().rstrip()))')" \
  "$(echo "$WORKING_DIR" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().rstrip()))')")

# ── Envia para a API ──────────────────────────────────────────────────────────
ENDPOINT="${AGREGADOR_URL%/}/api/agent/register"

echo "Registrando \"$NAME\" em $ENDPOINT ..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_SECRET" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [[ "$HTTP_CODE" == "201" ]]; then
  echo "Projeto registrado com sucesso!"
  echo "  Nome:      $NAME"
  [[ -n "$LOCAL_URL"  ]] && echo "  Local:     $LOCAL_URL"
  [[ -n "$CLOUD_URL"  ]] && echo "  Cloud:     $CLOUD_URL"
  [[ -n "$START_CMD"  ]] && echo "  Comando:   $START_CMD"
  echo "  Dashboard: $AGREGADOR_URL"
else
  echo "Erro ao registrar projeto (HTTP $HTTP_CODE):"
  echo "$BODY"
  exit 1
fi
