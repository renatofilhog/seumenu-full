#!/usr/bin/env bash
# =============================================================
# SeúMenu — First-time Production Setup Script
# Ubuntu 22.04 / 24.04 | Docker already installed
# Usage: sudo bash scripts/setup.sh
# =============================================================
set -euo pipefail

# ----- Colors -----
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ----- Root check -----
[[ $EUID -ne 0 ]] && error "Execute como root: sudo bash scripts/setup.sh"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

echo ""
echo "=================================================="
echo "   SeúMenu — Setup de Produção"
echo "   Domínio: app.seumenu.io / api.seumenu.io"
echo "=================================================="
echo ""

# ----- Step 1: Check Docker -----
info "Verificando Docker..."
command -v docker >/dev/null 2>&1 || error "Docker não encontrado. Instale Docker antes de continuar."
docker compose version >/dev/null 2>&1 || error "Docker Compose (plugin) não encontrado."
success "Docker OK"

# ----- Step 2: Firewall (UFW) -----
info "Configurando firewall UFW..."
if command -v ufw >/dev/null 2>&1; then
    ufw allow 22/tcp   comment 'SSH'    2>/dev/null
    ufw allow 80/tcp   comment 'HTTP'   2>/dev/null
    ufw allow 443/tcp  comment 'HTTPS'  2>/dev/null
    # Block direct access to app ports (Docker manages internal networking)
    ufw deny 3000/tcp  2>/dev/null || true
    ufw deny 5432/tcp  2>/dev/null || true
    ufw --force enable 2>/dev/null
    success "UFW configurado: liberado 22, 80, 443; bloqueado 3000, 5432"
else
    warn "UFW não encontrado. Configure o firewall manualmente."
fi

# ----- Step 3: Install Certbot -----
info "Verificando Certbot (Let's Encrypt)..."
if ! command -v certbot >/dev/null 2>&1; then
    info "Instalando Certbot via snap..."
    apt-get install -y snapd >/dev/null 2>&1 || true
    snap install --classic certbot >/dev/null 2>&1
    ln -sf /snap/bin/certbot /usr/bin/certbot
    success "Certbot instalado"
else
    success "Certbot já instalado"
fi

# ----- Step 4: Obtain SSL Certificates -----
info "Obtendo certificados SSL (Let's Encrypt) em um único comando..."
# Using a single certbot call for both domains avoids the "No such authorization" error
# that occurs when two sequential standalone calls try to reuse ACME authorizations.
CERT_DOMAINS=""
[[ ! -f /etc/letsencrypt/live/app.seumenu.io/fullchain.pem ]] && CERT_DOMAINS="-d app.seumenu.io"
[[ ! -f /etc/letsencrypt/live/api.seumenu.io/fullchain.pem ]] && CERT_DOMAINS="$CERT_DOMAINS -d api.seumenu.io"

if [[ -n "$CERT_DOMAINS" ]]; then
    # shellcheck disable=SC2086
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email admin@seumenu.io \
        $CERT_DOMAINS \
        || {
            warn "Falha no certbot combinado, tentando individualmente com --force-renewal..."
            sleep 5
            certbot certonly --standalone --non-interactive --agree-tos \
                --email admin@seumenu.io --force-renewal -d app.seumenu.io || true
            sleep 5
            certbot certonly --standalone --non-interactive --agree-tos \
                --email admin@seumenu.io --force-renewal -d api.seumenu.io \
                || error "Falha ao obter certificado para api.seumenu.io. Verifique DNS e tente novamente."
        }
    success "Certificados SSL obtidos"
else
    success "Certificados SSL já existem"
fi

# Legacy check kept for compatibility
if false; then
if [[ ! -f /etc/letsencrypt/live/app.seumenu.io/fullchain.pem ]]; then
    info "Obtendo certificado para app.seumenu.io..."
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email admin@seumenu.io \
        -d app.seumenu.io \
        || error "Falha ao obter certificado para app.seumenu.io. Verifique se o DNS está apontado corretamente."
    success "Certificado obtido para app.seumenu.io"
else
    success "Certificado app.seumenu.io já existe"
fi

if [[ ! -f /etc/letsencrypt/live/api.seumenu.io/fullchain.pem ]]; then
    info "Obtendo certificado para api.seumenu.io..."
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email admin@seumenu.io \
        -d api.seumenu.io \
        || error "Falha ao obter certificado para api.seumenu.io. Verifique se o DNS está apontado corretamente."
    success "Certificado obtido para api.seumenu.io"
else
    success "Certificado api.seumenu.io já existe"
fi
fi # end if false

# ----- Step 5: Setup Certbot Auto-Renewal -----
info "Configurando renovação automática de certificados..."
RENEW_CRON="/etc/cron.d/certbot-seumenu"
cat > "$RENEW_CRON" << 'CRON_EOF'
# Renew SSL certificates twice daily and reload nginx
0 0,12 * * * root certbot renew --quiet --deploy-hook "docker compose -f /opt/seumenu/docker-compose.yml exec -T nginx nginx -s reload"
CRON_EOF
# Update path in cron with actual project dir
sed -i "s|/opt/seumenu|$PROJECT_DIR|g" "$RENEW_CRON"
chmod 644 "$RENEW_CRON"
success "Cron de renovação SSL configurado"

# ----- Step 6: Generate Secrets -----
info "Gerando senhas e segredos aleatórios..."
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
JWT_SECRET=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 48)
success "Senhas geradas com openssl rand"

# ----- Step 7: AWS Credentials -----
echo ""
echo -e "${YELLOW}Configure as credenciais do AWS S3 (storage-seumenu, us-east-1):${NC}"
echo "  Nota: As credenciais não serão exibidas na tela."
echo ""
read -rp "  AWS Access Key ID: " S3_ACCESS_KEY
read -rsp "  AWS Secret Access Key: " S3_SECRET_KEY
echo ""

[[ -z "$S3_ACCESS_KEY" ]] && error "AWS Access Key ID não pode ser vazio"
[[ -z "$S3_SECRET_KEY" ]] && error "AWS Secret Access Key não pode ser vazio"
success "Credenciais AWS recebidas"

# ----- Step 8: Create .env file -----
info "Criando arquivo .env em $ENV_FILE ..."
cat > "$ENV_FILE" << ENV_EOF
# SeúMenu — Production Environment
# Gerado automaticamente por scripts/setup.sh em $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# NÃO COMMITAR ESTE ARQUIVO

# PostgreSQL
POSTGRES_USER=seumenu
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=seumenu

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# AWS S3
S3_REGION=us-east-1
S3_BUCKET=storage-seumenu
S3_ACCESS_KEY=${S3_ACCESS_KEY}
S3_SECRET_KEY=${S3_SECRET_KEY}

# Tenant routing
TENANT_SLUG_BASE_HOSTS=app.seumenu.io
ENV_EOF

chmod 600 "$ENV_FILE"
success ".env criado com permissão 600 (somente root)"

# Unset secrets from memory
unset S3_SECRET_KEY POSTGRES_PASSWORD JWT_SECRET

# ----- Step 9: Build and start containers -----
info "Construindo e iniciando containers Docker..."
cd "$PROJECT_DIR"
docker compose pull nginx 2>/dev/null || true
docker compose build --no-cache
docker compose up -d
success "Containers iniciados"

# ----- Step 10: Wait for database -----
info "Aguardando banco de dados ficar disponível..."
for i in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U seumenu -d seumenu >/dev/null 2>&1; then
        success "Banco de dados pronto"
        break
    fi
    if [[ $i -eq 30 ]]; then
        error "Banco não ficou disponível após 30 tentativas. Verifique: docker compose logs postgres"
    fi
    echo -n "."
    sleep 2
done

# ----- Step 11: Run database migrations -----
info "Executando migrações do banco de dados..."
docker compose exec -T backend \
    sh -c "NODE_ENV=production npx knex migrate:latest --knexfile /app/knexfile.js" \
    && success "Migrações executadas com sucesso" \
    || error "Falha nas migrações. Verifique: docker compose logs backend"

# ----- Step 12: Verify services -----
info "Verificando serviços..."
sleep 5

BACKEND_STATUS=$(docker compose ps backend --format json 2>/dev/null | grep -c '"running"' || echo 0)
FRONTEND_STATUS=$(docker compose ps frontend --format json 2>/dev/null | grep -c '"running"' || echo 0)
NGINX_STATUS=$(docker compose ps nginx --format json 2>/dev/null | grep -c '"running"' || echo 0)

docker compose ps

echo ""
echo "=================================================="
echo -e "${GREEN}   SeúMenu implantado com sucesso!${NC}"
echo "=================================================="
echo ""
echo "  Frontend:  https://app.seumenu.io"
echo "  API:       https://api.seumenu.io"
echo "  API Docs:  https://api.seumenu.io/api-docs"
echo ""
echo -e "${YELLOW}ATENÇÃO — Configurações obrigatórias no AWS S3:${NC}"
echo "  1. No bucket 'storage-seumenu', em 'Permissions':"
echo "     - Desabilite 'Block all public access'"
echo "     - Adicione a seguinte Bucket Policy:"
echo ""
cat << 'S3_POLICY'
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::storage-seumenu/*"
      }
    ]
  }
S3_POLICY
echo ""
echo -e "${YELLOW}Comandos úteis:${NC}"
echo "  Ver logs:              docker compose logs -f [backend|frontend|nginx|postgres]"
echo "  Reiniciar serviço:     docker compose restart [serviço]"
echo "  Rodar migrações:       docker compose exec backend npx knex migrate:latest --knexfile /app/knexfile.js"
echo "  Status containers:     docker compose ps"
echo ""
