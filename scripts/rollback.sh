#!/usr/bin/env bash
# ==============================================================================
# Algions Platform — Automated Application Rollback Procedure
# ==============================================================================
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

HISTORY_FILE="${ROOT_DIR}/.deployment_history"

echo "================================================================="
echo "   Algions AI Labs — Emergency Rollback Procedure               "
echo "================================================================="

if [[ ! -f "${HISTORY_FILE}" ]]; then
    echo "❌ Error: Deployment history file (${HISTORY_FILE}) not found."
    echo "Cannot determine previous known-good image version."
    exit 1
fi

TOTAL_ENTRIES=$(wc -l < "${HISTORY_FILE}" | tr -d ' ')
if [[ "${TOTAL_ENTRIES}" -lt 2 ]]; then
    echo "⚠️ Warning: Only ${TOTAL_ENTRIES} entry in deployment history."
    PREV_TAG="$(head -n 1 "${HISTORY_FILE}")"
else
    # Pick the second-to-last recorded deployment tag
    PREV_TAG="$(tail -n 2 "${HISTORY_FILE}" | head -n 1)"
fi

echo "Target rollback image version: ${PREV_TAG}"

# Redeploy previous known-good version
export API_IMAGE="${API_IMAGE:-ghcr.io/sayyeds/algions-api}:${PREV_TAG}"
export WEB_IMAGE="${WEB_IMAGE:-ghcr.io/sayyeds/algions-web}:${PREV_TAG}"

echo "Redeploying containers to version ${PREV_TAG}..."
docker compose up -d --no-deps api nginx

# Verify rollback health
echo "Verifying restored application health..."
ATTEMPT=0
ROLLBACK_SUCCESS=false

while [[ ${ATTEMPT} -lt 15 ]]; do
    STATUS_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost/api/v1/health/ready || curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/v1/health/ready || echo "000")
    if [[ "${STATUS_CODE}" == "200" ]]; then
        ROLLBACK_SUCCESS=true
        break
    fi
    sleep 2
    ATTEMPT=$((ATTEMPT + 1))
done

if [[ "${ROLLBACK_SUCCESS}" == "true" ]]; then
    echo "✓ Rollback completed successfully! Application restored to version ${PREV_TAG}."
    echo "${PREV_TAG}-rollback-restored" >> "${HISTORY_FILE}"
    exit 0
else
    echo "❌ Fatal: Restored image failed health verification."
    docker compose logs --tail=50 api
    exit 1
fi
