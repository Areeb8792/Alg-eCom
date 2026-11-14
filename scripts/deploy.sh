#!/usr/bin/env bash
# ==============================================================================
# Algions Platform — Zero-Downtime Deployment & Automated Health Verification
# ==============================================================================
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

IMAGE_TAG="${1:-latest}"
HISTORY_FILE="${ROOT_DIR}/.deployment_history"

echo "================================================================="
echo "   Algions AI Labs — Container Deployment Routine                "
echo "   Target Version / Tag: ${IMAGE_TAG}                            "
echo "================================================================="

# Record current image tag for potential rollback
CURRENT_TAG="unknown"
if [[ -f "${HISTORY_FILE}" ]]; then
    CURRENT_TAG="$(tail -n 1 "${HISTORY_FILE}" || echo 'unknown')"
fi
echo "Current active image tag: ${CURRENT_TAG}"

# Source environment variables if .env exists
if [[ -f "${ROOT_DIR}/.env" ]]; then
    # shellcheck disable=SC1091
    source "${ROOT_DIR}/.env" || true
fi

# Reject unchanged placeholder credentials
if [[ -f "${ROOT_DIR}/.env" ]] && grep -q "REPLACE_WITH_" "${ROOT_DIR}/.env" 2>/dev/null; then
    echo "❌ FATAL: Unchanged placeholder credentials detected in .env. Replace all 'REPLACE_WITH_' secrets before deploying."
    exit 1
fi

DB_MIGRATION_USER="${DB_MIGRATION_USER:-algions_admin}"
DB_NAME="${DB_NAME:-algions_db}"

# 1. Pull / Prepare image
echo "[1/4] Preparing image ${IMAGE_TAG}..."
export API_IMAGE="${API_IMAGE_NAME:-algions-api}:${IMAGE_TAG}"
export WEB_IMAGE="${WEB_IMAGE_NAME:-algions-web}:${IMAGE_TAG}"

# 2. Run Database Migrations safely via one-shot container using algions_admin credentials
echo "[2/4] Executing backward-compatible database migrations as '${DB_MIGRATION_USER}'..."
if docker compose ps -q postgres &>/dev/null; then
    if [[ -z "${DB_MIGRATION_PASSWORD:-}" ]]; then
        echo "❌ FATAL: DB_MIGRATION_PASSWORD is not set. Migration credentials must be explicitly provided."
        exit 1
    fi

    # Run migrations in a separate, isolated one-shot container so the long-running API container never receives migration credentials
    if ! docker compose run --rm --no-deps \
        -e NODE_ENV=production \
        -e DATABASE_URL="postgresql://${DB_MIGRATION_USER}:${DB_MIGRATION_PASSWORD}@postgres:5432/${DB_NAME}" \
        api node dist/database/migrate.js; then
        echo "❌ FATAL: Database migration failed. Halting deployment to prevent schema inconsistency."
        exit 1
    fi
    echo "✓ Migrations executed successfully via dedicated one-shot migration runner."
fi

# 3. Deploy New Container Instances
echo "[3/4] Deploying containers with version ${IMAGE_TAG}..."
docker compose up -d --no-deps api nginx

# 4. Post-Deployment Readiness Verification Loop
echo "[4/4] Verifying post-deployment application readiness..."
MAX_ATTEMPTS=20
ATTEMPT=0
DEPLOY_SUCCESS=false

while [[ ${ATTEMPT} -lt ${MAX_ATTEMPTS} ]]; do
    STATUS_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost/api/v1/health/ready || curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/v1/health/ready || echo "000")
    if [[ "${STATUS_CODE}" == "200" ]]; then
        DEPLOY_SUCCESS=true
        break
    fi
    echo "Probing readiness endpoint... (Status: ${STATUS_CODE}, attempt $((ATTEMPT + 1))/${MAX_ATTEMPTS})"
    sleep 3
    ATTEMPT=$((ATTEMPT + 1))
done

if [[ "${DEPLOY_SUCCESS}" == "true" ]]; then
    echo "✓ Deployment verified! Service is healthy and serving requests."
    echo "${IMAGE_TAG}" >> "${HISTORY_FILE}"
    echo "Deployment recorded in ${HISTORY_FILE}"
    exit 0
else
    echo "❌ Deployment verification failed! Service is not healthy."
    echo "Initiating automated rollback to previous version: ${CURRENT_TAG}..."
    bash "${ROOT_DIR}/scripts/rollback.sh"
    exit 1
fi
