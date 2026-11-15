#!/usr/bin/env bash
# ==============================================================================
# Algions Platform — Automated VPS Deployment Procedure (Ubuntu 24.04 LTS)
# Architecture: Docker Compose, PostgreSQL 16, Node.js API, React SPA, Nginx,
# Prometheus, Grafana, and Automated Let's Encrypt TLS
# ==============================================================================
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "================================================================="
echo "   Algions AI Labs — Public VPS Deployment & Initialization      "
echo "   Target OS: Ubuntu 24.04 LTS / Debian Linux                     "
echo "================================================================="

# ------------------------------------------------------------------------------
# Step 1: Install & Verify Host Prerequisites
# ------------------------------------------------------------------------------
echo "[1/10] Verifying and installing system prerequisites..."

if [[ "$OSTYPE" == "linux-gnu"* ]] && command -v apt-get &>/dev/null; then
    if ! command -v docker &>/dev/null || ! docker compose version &>/dev/null; then
        echo "Installing Docker Engine and Docker Compose plugin..."
        sudo apt-get update -y
        sudo apt-get install -y ca-certificates curl gnupg lsb-release openssl
        sudo install -m 0755 -d /etc/apt/keyrings
        if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            sudo chmod a+r /etc/apt/keyrings/docker.gpg
        fi
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update -y
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        sudo systemctl enable --now docker
        echo "✓ Docker installed and started."
    fi
fi

for cmd in docker openssl curl; do
    if ! command -v "${cmd}" &>/dev/null; then
        echo "❌ Error: Required binary '${cmd}' is not installed or not in PATH."
        exit 1
    fi
done

if ! docker compose version &>/dev/null; then
    echo "❌ Error: Docker Compose v2 is required but not accessible."
    exit 1
fi
echo "✓ System prerequisites verified."

# ------------------------------------------------------------------------------
# Step 2: Validate Production Environment Variables
# ------------------------------------------------------------------------------
echo "[2/10] Validating production environment configuration (.env)..."

if [[ ! -f ".env" ]]; then
    if [[ -f ".env.example" ]]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        echo "⚠️ Created template .env. Please configure real production secrets before re-running."
        exit 1
    else
        echo "❌ FATAL: No .env or .env.example found in ${ROOT_DIR}."
        exit 1
    fi
fi

# shellcheck disable=SC1091
source "${ROOT_DIR}/.env"

# Reject unconfigured placeholder values
if grep -q "REPLACE_WITH_" "${ROOT_DIR}/.env" 2>/dev/null; then
    echo "❌ FATAL: Unchanged placeholder credentials detected in .env."
    echo "Replace all 'REPLACE_WITH_' secrets with strong, random credentials."
    exit 1
fi

# Validate critical secrets
REQUIRED_VARS=(
    "POSTGRES_PASSWORD"
    "DB_MIGRATION_PASSWORD"
    "DB_APP_PASSWORD"
    "DB_BACKUP_PASSWORD"
    "JWT_SECRET"
    "ADMIN_PASSWORD"
    "GRAFANA_ADMIN_PASSWORD"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        echo "❌ FATAL: Environment variable '${var}' is required but empty in .env."
        exit 1
    fi
done

if [[ ${#JWT_SECRET} -lt 32 ]]; then
    echo "❌ FATAL: JWT_SECRET must be at least 32 characters in production."
    exit 1
fi

SERVER_NAME="${SERVER_NAME:-localhost}"
DB_NAME="${DB_NAME:-algions_db}"
POSTGRES_USER="${POSTGRES_USER:-algions_user}"
DB_MIGRATION_USER="${DB_MIGRATION_USER:-algions_admin}"
IMAGE_TAG="${IMAGE_TAG:-v1.0.5}"
echo "✓ Environment validation passed (Target Domain: ${SERVER_NAME}, Version: ${IMAGE_TAG})."

# Determine Compose files
COMPOSE_ARGS=(-f docker-compose.yml)
if [[ -f "docker-compose.prod.yml" ]]; then
    COMPOSE_ARGS+=(-f docker-compose.prod.yml)
fi

# ------------------------------------------------------------------------------
# Step 3: Build or Pull Application Images
# ------------------------------------------------------------------------------
echo "[3/10] Preparing container images (Tag: ${IMAGE_TAG})..."
if [[ "${PULL_IMAGES:-true}" == "true" ]]; then
    echo "Pulling verified pre-built images from GitHub Container Registry..."
    docker compose "${COMPOSE_ARGS[@]}" pull api nginx postgres prometheus grafana || {
        echo "Notice: Registry pull failed or images not available remotely. Falling back to local build..."
        docker compose "${COMPOSE_ARGS[@]}" build
    }
else
    docker compose "${COMPOSE_ARGS[@]}" build
fi

# ------------------------------------------------------------------------------
# Step 4: Start PostgreSQL & Wait for Health Check
# ------------------------------------------------------------------------------
echo "[4/10] Starting PostgreSQL container with persistent volume storage..."
# Named volume 'postgres_data' is preserved across deployments and never recreated
docker compose "${COMPOSE_ARGS[@]}" up -d postgres

echo "Waiting for PostgreSQL service to pass internal health check..."
PG_HEALTHY=false
for i in {1..30}; do
    if docker compose "${COMPOSE_ARGS[@]}" exec -T postgres pg_isready -U "${POSTGRES_USER}" -d "${DB_NAME}" &>/dev/null; then
        PG_HEALTHY=true
        break
    fi
    echo "Probing postgres (attempt $i/30)..."
    sleep 2
done

if [[ "${PG_HEALTHY}" != "true" ]]; then
    echo "❌ FATAL: PostgreSQL container failed to report healthy within 60s."
    docker compose "${COMPOSE_ARGS[@]}" logs postgres
    exit 1
fi
echo "✓ PostgreSQL is online, healthy, and accepting connections."

# ------------------------------------------------------------------------------
# Step 5: Execute Database Migrations (Dedicated Migration Role)
# ------------------------------------------------------------------------------
echo "[5/10] Applying backward-compatible schema migrations via '${DB_MIGRATION_USER}' role..."
if ! docker compose "${COMPOSE_ARGS[@]}" run --rm --no-deps \
    -e NODE_ENV=production \
    -e DATABASE_URL="postgresql://${DB_MIGRATION_USER}:${DB_MIGRATION_PASSWORD}@postgres:5432/${DB_NAME}" \
    api node dist/database/migrate.js; then
    echo "❌ FATAL: Database migration failed. Halting deployment to prevent schema inconsistency."
    exit 1
fi
echo "✓ Database schema migrations applied successfully."

# ------------------------------------------------------------------------------
# Step 6: Conditional Database Seeding
# ------------------------------------------------------------------------------
echo "[6/10] Checking database baseline and conditional seeding..."
EXISTING_PRODUCTS=$(docker compose "${COMPOSE_ARGS[@]}" exec -T postgres psql -U "${POSTGRES_USER}" -d "${DB_NAME}" -t -A -c "SELECT COUNT(*) FROM products;" 2>/dev/null || echo "0")
EXISTING_PRODUCTS=$(echo "${EXISTING_PRODUCTS}" | tr -d ' \r\n')

if [[ "${EXISTING_PRODUCTS}" == "0" || "${SEED_DATABASE:-false}" == "true" ]]; then
    echo "Database contains ${EXISTING_PRODUCTS} products. Running baseline catalog seed..."
    docker compose "${COMPOSE_ARGS[@]}" run --rm --no-deps \
        -e NODE_ENV=production \
        -e DATABASE_URL="postgresql://${DB_MIGRATION_USER}:${DB_MIGRATION_PASSWORD}@postgres:5432/${DB_NAME}" \
        api node dist/database/seed.js
    echo "✓ Baseline catalog seed completed successfully."
else
    echo "✓ Production catalog already populated with ${EXISTING_PRODUCTS} products. Preserving existing data."
fi

# ------------------------------------------------------------------------------
# Step 7: Initialize TLS Certificates (Let's Encrypt / Fallback)
# ------------------------------------------------------------------------------
echo "[7/10] Initializing TLS certificates for '${SERVER_NAME}'..."
bash "${ROOT_DIR}/scripts/init-letsencrypt.sh"

# ------------------------------------------------------------------------------
# Step 8: Launch Complete Application Stack
# ------------------------------------------------------------------------------
echo "[8/10] Starting API, Nginx, Prometheus, Grafana, and Certbot..."
docker compose "${COMPOSE_ARGS[@]}" up -d api nginx prometheus grafana certbot

# ------------------------------------------------------------------------------
# Step 9: Post-Deployment Readiness Verification Loop
# ------------------------------------------------------------------------------
echo "[9/10] Verifying post-deployment application readiness..."
MAX_ATTEMPTS=20
ATTEMPT=0
DEPLOY_SUCCESS=false

while [[ ${ATTEMPT} -lt ${MAX_ATTEMPTS} ]]; do
    STATUS_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "https://${SERVER_NAME}/api/v1/health/ready" || curl -k -s -o /dev/null -w "%{http_code}" "https://localhost/api/v1/health/ready" || echo "000")
    if [[ "${STATUS_CODE}" == "200" ]]; then
        DEPLOY_SUCCESS=true
        break
    fi
    echo "Probing readiness endpoint... (Status: ${STATUS_CODE}, attempt $((ATTEMPT + 1))/${MAX_ATTEMPTS})"
    sleep 3
    ATTEMPT=$((ATTEMPT + 1))
done

if [[ "${DEPLOY_SUCCESS}" != "true" ]]; then
    echo "❌ FATAL: Application readiness probe failed after ${MAX_ATTEMPTS} attempts."
    echo "Dumping container statuses and logs:"
    docker compose "${COMPOSE_ARGS[@]}" ps
    docker compose "${COMPOSE_ARGS[@]}" logs --tail=50 api nginx
    exit 1
fi
echo "✓ Health readiness probe returned HTTP 200 OK."

# ------------------------------------------------------------------------------
# Step 10: Run Production Smoke Test Suite
# ------------------------------------------------------------------------------
echo "[10/10] Executing production smoke tests..."
TARGET_URL="https://${SERVER_NAME}"
if [[ "${SERVER_NAME}" == "localhost" ]]; then
    TARGET_URL="https://localhost"
fi

if bash "${ROOT_DIR}/scripts/smoke-test.sh" "${TARGET_URL}"; then
    echo "================================================================="
    echo "✓ PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo "  Public Storefront: ${TARGET_URL}"
    echo "  Health Endpoint:   ${TARGET_URL}/api/v1/health/ready"
    echo "  Metrics:           ${TARGET_URL}/api/v1/metrics"
    echo "  Grafana Dashboard: http://127.0.0.1:${GRAFANA_PORT:-3001} (Localhost Only)"
    echo "================================================================="
    echo "${IMAGE_TAG}" >> "${ROOT_DIR}/.deployment_history"
    exit 0
else
    echo "❌ Smoke tests failed! Initiating rollback..."
    bash "${ROOT_DIR}/scripts/rollback.sh"
    exit 1
fi
