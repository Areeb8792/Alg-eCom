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

# 1. Pull / Prepare image
echo "[1/4] Preparing image ${IMAGE_TAG}..."
export API_IMAGE="${API_IMAGE_NAME:-algions-api}:${IMAGE_TAG}"
export WEB_IMAGE="${WEB_IMAGE_NAME:-algions-web}:${IMAGE_TAG}"

# 2. Run Database Migrations safely before updating API
echo "[2/4] Executing backward-compatible database migrations..."
if docker compose ps -q api &>/dev/null; then
    if ! docker compose exec -T api node dist/database/migrate.js; then
        echo "❌ FATAL: Database migration failed. Halting deployment to prevent schema inconsistency."
        exit 1
    fi
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
