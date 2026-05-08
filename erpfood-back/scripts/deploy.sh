#!/usr/bin/env bash
# =============================================================
# SeúMenu — Deploy Script
# Uso: bash scripts/deploy.sh [--skip-migrations]
# Roda git pull nos dois projetos e refaz o deploy em produção.
# Deve ser executado dentro do diretório raiz do projeto (onde
# está o docker-compose.yml e as pastas erpfood-back/ e seumenu-front/).
# =============================================================
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

[[ ! -f "$PROJECT_DIR/.env" ]] && error "Arquivo .env não encontrado em $PROJECT_DIR. Execute setup.sh primeiro."
[[ ! -f "$PROJECT_DIR/docker-compose.yml" ]] && error "docker-compose.yml não encontrado. Execute dentro do diretório raiz do projeto."

echo ""
echo "=================================================="
echo "   SeúMenu — Deploy de Produção"
echo "   $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================================="
echo ""

# ----- Step 1: git pull erpfood-back -----
info "Atualizando erpfood-back..."
if [[ -d "$PROJECT_DIR/erpfood-back/.git" ]]; then
    cd "$PROJECT_DIR/erpfood-back"
    BEFORE=$(git rev-parse HEAD)
    git pull origin main
    AFTER=$(git rev-parse HEAD)
    if [[ "$BEFORE" != "$AFTER" ]]; then
        success "erpfood-back atualizado: $(git log --oneline -3)"
        BACKEND_CHANGED=true
    else
        success "erpfood-back já está na versão mais recente"
        BACKEND_CHANGED=false
    fi
else
    warn "erpfood-back não é um repositório git. Pulando git pull."
    BACKEND_CHANGED=true
fi

# ----- Step 2: git pull seumenu-front -----
info "Atualizando seumenu-front..."
if [[ -d "$PROJECT_DIR/seumenu-front/.git" ]]; then
    cd "$PROJECT_DIR/seumenu-front"
    BEFORE=$(git rev-parse HEAD)
    git pull origin main
    AFTER=$(git rev-parse HEAD)
    if [[ "$BEFORE" != "$AFTER" ]]; then
        success "seumenu-front atualizado: $(git log --oneline -3)"
        FRONTEND_CHANGED=true
    else
        success "seumenu-front já está na versão mais recente"
        FRONTEND_CHANGED=false
    fi
else
    warn "seumenu-front não é um repositório git. Pulando git pull."
    FRONTEND_CHANGED=true
fi

cd "$PROJECT_DIR"

# ----- Step 3: Build only changed services -----
info "Fazendo build dos containers..."
if [[ "$BACKEND_CHANGED" == true && "$FRONTEND_CHANGED" == true ]]; then
    docker compose build --no-cache backend frontend
elif [[ "$BACKEND_CHANGED" == true ]]; then
    docker compose build --no-cache backend
elif [[ "$FRONTEND_CHANGED" == true ]]; then
    docker compose build --no-cache frontend
else
    warn "Nenhuma mudança detectada nos projetos. Reconstruindo mesmo assim..."
    docker compose build backend frontend
fi
success "Build concluído"

# ----- Step 4: Rolling restart (zero downtime) -----
info "Subindo containers atualizados..."
docker compose up -d --remove-orphans
success "Containers atualizados"

# ----- Step 5: Wait for backend health -----
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

# ----- Step 6: Migrations -----
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

# ----- Step 7: Cleanup old images -----
info "Limpando imagens antigas..."
docker image prune -f >/dev/null 2>&1 || true
success "Imagens antigas removidas"

# ----- Done -----
echo ""
echo "=================================================="
echo -e "${GREEN}   Deploy concluído com sucesso!${NC}"
echo "   $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================================="
echo ""
echo "  Frontend:  https://app.seumenu.io"
echo "  API:       https://api.seumenu.io"
echo "  API Docs:  https://api.seumenu.io/api-docs"
echo ""
echo "  Status:    docker compose ps"
echo "  Logs:      docker compose logs -f [backend|frontend|nginx]"
echo ""
