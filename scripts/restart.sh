#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

SKIP_MIGRATIONS=false
for arg in "$@"; do
  [[ "$arg" == "--skip-migrations" ]] && SKIP_MIGRATIONS=true
done

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

[[ ! -f "$PROJECT_DIR/.env" ]] && error "Arquivo .env não encontrado em $PROJECT_DIR."
[[ ! -f "$PROJECT_DIR/docker-compose.yml" ]] && error "docker-compose.yml não encontrado."

echo ""
echo "=================================================="
echo "   SeúMenu — Restart"
echo "   $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================================="
echo ""

info "Fazendo build dos containers backend e frontend..."
docker compose build backend frontend
success "Build concluído"

info "Reiniciando os containers..."
docker compose up -d --remove-orphans
success "Containers reiniciados"

info "Aguardando backend ficar disponível..."
for i in $(seq 1 30); do
  if docker compose exec -T backend wget -qO- http://localhost:3000/ >/dev/null 2>&1; then
    success "Backend respondendo"
    break
  fi
  if [[ $i -eq 30 ]]; then
    warn "Backend não respondeu em 60s. Verifique: docker compose logs backend"
  fi
  echo -n "."
  sleep 2
done
echo ""

if [[ "$SKIP_MIGRATIONS" == false ]]; then
  info "Verificando migrações pendentes..."
  PENDING=$(docker compose exec -T backend \
    sh -c "NODE_ENV=production npx knex migrate:status --knexfile /app/knexfile.js 2>/dev/null | grep 'Not Run' | wc -l" \
    2>/dev/null || echo "0")
  PENDING=$(echo "$PENDING" | tr -d '[:space:]')

  if [[ "$PENDING" -gt 0 ]] 2>/dev/null; then
    info "$PENDING migração(ões) pendente(s). Aplicando..."
    docker compose exec -T backend \
      sh -c "NODE_ENV=production npx knex migrate:latest --knexfile /app/knexfile.js" \
      && success "Migrações aplicadas" \
      || error "Falha nas migrações. Verifique: docker compose logs backend"
  else
    success "Banco de dados já está atualizado"
  fi
else
  warn "Migrações ignoradas (--skip-migrations)"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}   Restart concluído com sucesso!${NC}"
echo "   $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================================="
echo ""
echo "  Status: docker compose ps"
echo "  Logs:   docker compose logs -f [backend|frontend|nginx]"
echo ""
