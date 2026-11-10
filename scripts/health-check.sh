#!/usr/bin/env bash
# ==============================================================================
# Algions Platform — Health & Readiness Inspection Script
# ==============================================================================
set -Eeuo pipefail

BASE_URL="${1:-https://localhost}"

echo "================================================================="
echo "   Algions AI Labs — Platform Operational Health Inspection      "
echo "   Target Base URL: ${BASE_URL}                                  "
echo "================================================================="

# 1. Container status if docker is present
if command -v docker &>/dev/null && docker compose version &>/dev/null; then
    echo "[1/3] Docker Compose Container Status:"
    docker compose ps || true
    echo ""
fi

# 2. Liveness Check
echo "[2/3] Probing /api/v1/health/live..."
LIVE_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/v1/health/live" || echo "000")
if [[ "${LIVE_CODE}" == "200" ]]; then
    LIVE_BODY=$(curl -k -s "${BASE_URL}/api/v1/health/live")
    echo "✓ LIVE: HTTP 200 OK"
    echo "  ${LIVE_BODY}"
else
    echo "❌ LIVE FAILED: HTTP ${LIVE_CODE}"
fi
echo ""

# 3. Readiness Check
echo "[3/3] Probing /api/v1/health/ready..."
READY_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/v1/health/ready" || echo "000")
if [[ "${READY_CODE}" == "200" ]]; then
    READY_BODY=$(curl -k -s "${BASE_URL}/api/v1/health/ready")
    echo "✓ READY: HTTP 200 OK (Database Connected)"
    echo "  ${READY_BODY}"
else
    echo "❌ READY FAILED: HTTP ${READY_CODE}"
    echo "  (Check PostgreSQL service connectivity and logs)"
fi

echo "================================================================="
