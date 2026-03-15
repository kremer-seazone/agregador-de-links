#!/usr/bin/env bash
# bulk-register — escaneia ~/Claude-Code/ e registra no Agregador todos os
# projetos que ainda não estão cadastrados (dedup por workingDir)
#
# Uso:
#   bulk-register [--dir ~/outra/pasta] [--dry-run]
#
# Variáveis de ambiente (ou em ~/.agregador):
#   AGREGADOR_URL   URL do dashboard
#   AGENT_SECRET    Token do agente

set -euo pipefail

SCAN_DIR="${HOME}/Claude-Code"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir)     SCAN_DIR="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true;  shift ;;
    *) echo "Opção desconhecida: $1"; exit 1 ;;
  esac
done

# ── Carrega ~/.agregador ──────────────────────────────────────────────────────
CONFIG_FILE="$HOME/.agregador"
if [[ -f "$CONFIG_FILE" ]]; then
  source "$CONFIG_FILE"
fi

if [[ -z "${AGREGADOR_URL:-}" || -z "${AGENT_SECRET:-}" ]]; then
  echo "Erro: AGREGADOR_URL e AGENT_SECRET são obrigatórios."
  echo "Configure em ~/.agregador"
  exit 1
fi

# ── Busca projetos já cadastrados ─────────────────────────────────────────────
echo "Buscando projetos já cadastrados..."
EXISTING_JSON=$(curl -s \
  -H "Authorization: Bearer $AGENT_SECRET" \
  "${AGREGADOR_URL%/}/api/agent/register")

# Extrai os workingDirs já registrados (usando python3 como parser JSON portável)
EXISTING_DIRS=$(echo "$EXISTING_JSON" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    for p in data:
        wd = p.get('workingDir', '').rstrip('/')
        if wd:
            print(wd)
except:
    pass
" 2>/dev/null || true)

echo "Projetos já no dashboard: $(echo "$EXISTING_DIRS" | grep -c . || echo 0)"
echo ""

# ── Helpers de detecção ───────────────────────────────────────────────────────

# Detecta porta a partir de uma string de script npm
detect_port() {
  local script="$1"
  # -p 3001 / --port 3001 / PORT=3001
  local p
  p=$(echo "$script" | grep -oP '(?<=-p\s)\d+' | head -1)
  [[ -n "$p" ]] && echo "$p" && return
  p=$(echo "$script" | grep -oP '(?<=--port\s)\d+' | head -1)
  [[ -n "$p" ]] && echo "$p" && return
  p=$(echo "$script" | grep -oP '(?<=PORT=)\d+' | head -1)
  [[ -n "$p" ]] && echo "$p" && return
  echo ""
}

# Detecta porta padrão pelo framework
detect_default_port() {
  local dir="$1"
  [[ -f "$dir/next.config.js" || -f "$dir/next.config.ts" || -f "$dir/next.config.mjs" ]] && echo "3000" && return
  [[ -f "$dir/vite.config.js" || -f "$dir/vite.config.ts" ]] && echo "5173" && return
  [[ -f "$dir/angular.json" ]] && echo "4200" && return
  [[ -f "$dir/nuxt.config.js" || -f "$dir/nuxt.config.ts" ]] && echo "3000" && return
  [[ -f "$dir/gatsby-config.js" || -f "$dir/gatsby-config.ts" ]] && echo "8000" && return
  echo "3000"  # fallback
}

# Lê campo de package.json com python3
pkg_field() {
  local file="$1" field="$2"
  python3 -c "
import json, sys
try:
    with open('$file') as f:
        d = json.load(f)
    keys = '$field'.split('.')
    v = d
    for k in keys:
        v = v[k]
    print(v)
except:
    print('')
" 2>/dev/null || true
}

# ── Escaneia os projetos ──────────────────────────────────────────────────────
REGISTERED=0
SKIPPED=0
FAILED=0

for PROJECT_DIR in "$SCAN_DIR"/*/; do
  PROJECT_DIR="${PROJECT_DIR%/}"

  # Ignora pastas que começam com _ (ex: _knowledge, _outputs)
  FOLDER=$(basename "$PROJECT_DIR")
  [[ "$FOLDER" == _* ]] && continue

  # Ignora o próprio agregador (já está aqui)
  [[ "$FOLDER" == "agregador-de-links" ]] && continue

  # ── Dedup: pula se workingDir já está cadastrado ──────────────────────────
  if echo "$EXISTING_DIRS" | grep -qxF "$PROJECT_DIR"; then
    echo "⏭  $FOLDER — já cadastrado, pulando"
    ((SKIPPED++)) || true
    continue
  fi

  # ── Detecta metadados do projeto ──────────────────────────────────────────
  NAME="$FOLDER"
  DESCRIPTION=""
  START_CMD=""
  LOCAL_URL=""

  if [[ -f "$PROJECT_DIR/package.json" ]]; then
    PKG_NAME=$(pkg_field "$PROJECT_DIR/package.json" "name")
    [[ -n "$PKG_NAME" && "$PKG_NAME" != "null" ]] && NAME="$PKG_NAME"

    PKG_DESC=$(pkg_field "$PROJECT_DIR/package.json" "description")
    [[ -n "$PKG_DESC" && "$PKG_DESC" != "null" ]] && DESCRIPTION="$PKG_DESC"

    # Prefere "dev", depois "start"
    DEV_SCRIPT=$(pkg_field "$PROJECT_DIR/package.json" "scripts.dev")
    START_SCRIPT=$(pkg_field "$PROJECT_DIR/package.json" "scripts.start")

    if [[ -n "$DEV_SCRIPT" && "$DEV_SCRIPT" != "null" ]]; then
      START_CMD="npm run dev"
      PORT=$(detect_port "$DEV_SCRIPT")
      [[ -z "$PORT" ]] && PORT=$(detect_default_port "$PROJECT_DIR")
    elif [[ -n "$START_SCRIPT" && "$START_SCRIPT" != "null" ]]; then
      START_CMD="npm start"
      PORT=$(detect_port "$START_SCRIPT")
      [[ -z "$PORT" ]] && PORT=$(detect_default_port "$PROJECT_DIR")
    else
      PORT=$(detect_default_port "$PROJECT_DIR")
    fi

    LOCAL_URL="http://localhost:$PORT"

  elif [[ -f "$PROJECT_DIR/requirements.txt" || -f "$PROJECT_DIR/pyproject.toml" ]]; then
    # Projeto Python
    START_CMD="python main.py"
    LOCAL_URL="http://localhost:8000"

  elif [[ -f "$PROJECT_DIR/go.mod" ]]; then
    # Projeto Go
    START_CMD="go run ."
    LOCAL_URL="http://localhost:8080"

  elif ls "$PROJECT_DIR"/*.html &>/dev/null 2>&1; then
    # HTML estático
    HTML_FILE=$(ls "$PROJECT_DIR"/*.html | head -1)
    LOCAL_URL="file://$HTML_FILE"
  fi

  # ── Registra ──────────────────────────────────────────────────────────────
  PAYLOAD=$(python3 -c "
import json
print(json.dumps({
    'name': '''$NAME''',
    'description': '''$DESCRIPTION''',
    'localUrl': '''$LOCAL_URL''',
    'cloudUrl': '',
    'startCmd': '''$START_CMD''',
    'workingDir': '''$PROJECT_DIR''',
}))" 2>/dev/null)

  if [[ "$DRY_RUN" == true ]]; then
    echo "🔍 [dry-run] $NAME"
    echo "     dir:  $PROJECT_DIR"
    [[ -n "$LOCAL_URL"  ]] && echo "     url:  $LOCAL_URL"
    [[ -n "$START_CMD"  ]] && echo "     cmd:  $START_CMD"
    echo ""
    ((REGISTERED++)) || true
    continue
  fi

  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${AGREGADOR_URL%/}/api/agent/register" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AGENT_SECRET" \
    -d "$PAYLOAD")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

  if [[ "$HTTP_CODE" == "201" ]]; then
    echo "✅ $NAME"
    [[ -n "$LOCAL_URL" ]] && echo "     → $LOCAL_URL"
    ((REGISTERED++)) || true
  else
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "❌ $NAME — erro $HTTP_CODE: $BODY"
    ((FAILED++)) || true
  fi
done

# ── Resumo ────────────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────"
if [[ "$DRY_RUN" == true ]]; then
  echo "Dry run — $REGISTERED para registrar, $SKIPPED já cadastrados"
else
  echo "Concluído — $REGISTERED registrados, $SKIPPED já existiam, $FAILED erros"
  [[ $REGISTERED -gt 0 ]] && echo "Dashboard: $AGREGADOR_URL"
fi
