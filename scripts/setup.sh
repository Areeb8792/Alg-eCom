#!/usr/bin/env bash
# ==============================================================================
# Algions Platform — Environment Setup & Automated Initialization
# ==============================================================================
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "================================================================="
echo "   Algions AI Labs — Platform Setup & Environment Initializer    "
echo "================================================================="

# 1. Prerequisite checks
echo "[1/6] Verifying host dependencies..."
for cmd in docker openssl; do
    if ! command -v "${cmd}" &>/dev/null; then
        echo "❌ Error: Required command '${cmd}' is not installed or not in PATH."
        exit 1
    fi
done

if ! docker compose version &>/dev/null; then
    echo "❌ Error: Docker Compose plugin is not installed or accessible."
    exit 1
fi
echo "✓ Docker and dependencies verified."

# 2. Environment Configuration
echo "[2/6] Checking environment configuration (.env)..."
if [[ ! -f ".env" ]]; then
    if [[ -f ".env.example" ]]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        echo "✓ Created .env file. Please review and update secrets for production."
    else
        echo "❌ Error: Neither .env nor .env.example found."
        exit 1
    fi
else
    echo "✓ Existing .env file detected."
fi

# 3. TLS Certificates
echo "[3/6] Generating TLS certificates for Nginx reverse proxy..."
bash "${ROOT_DIR}/infra/nginx/generate-certs.sh"

# 4. Build Containers
echo "[4/6] Building production container images..."
docker compose build

# 5. Start Infrastructure Services
echo "[5/6] Starting container services..."
docker compose up -d

# 6. Wait for Database Readiness & Run Seed
echo "[6/6] Waiting for PostgreSQL and API readiness..."
MAX_RETRIES=30
RETRY_COUNT=0
HEALTHY=false

while [[ ${RETRY_COUNT} -lt ${MAX_RETRIES} ]]; do
    if docker compose exec -T api node -e "const http = require('http'); http.get('http://localhost:4000/api/v1/health/ready', (r) => process.exit(r.statusCode === 200 ? 0 : 1));" &>/dev/null; then
        HEALTHY=true
        break
    fi
    echo "Waiting for services to become ready... ($((RETRY_COUNT + 1))/${MAX_RETRIES})"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [[ "${HEALTHY}" == "true" ]]; then
    echo "✓ Services are ready!"
    echo "Applying migrations and database seeds..."
    docker compose exec -T api node dist/database/migrate.js || true
    docker compose exec -T api node dist/database/seed.js || true
    echo ""
    echo "================================================================="
    echo "✓ Platform successfully initialized!"
    echo "- Web Frontend (HTTPS): https://localhost (or http://localhost)"
    echo "- Health Live:         https://localhost/api/v1/health/live"
    echo "- Health Ready:        https://localhost/api/v1/health/ready"
    echo "- Metrics:             https://localhost/api/v1/metrics"
    echo "================================================================="
else
    echo "❌ Error: Application failed to report ready within timeout."
    docker compose logs
    exit 1
fi
