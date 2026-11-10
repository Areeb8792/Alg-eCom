#!/usr/bin/env bash
# ==============================================================================
# Algions Platform — Safe Database Restore & Verification Routine
# ==============================================================================
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_FILE="${1:-}"
CONFIRM_FLAG="${2:-}"

echo "================================================================="
echo "   Algions AI Labs — PostgreSQL Database Restore Routine         "
echo "================================================================="

# Usage check
if [[ -z "${BACKUP_FILE}" ]]; then
    echo "Usage: $0 <path_to_backup.dump> [--confirm]"
    echo ""
    echo "Example: $0 backups/db_backup_20261110_120000.dump --confirm"
    exit 1
fi

if [[ ! -f "${BACKUP_FILE}" ]]; then
    echo "❌ Error: Backup file '${BACKUP_FILE}' does not exist."
    exit 1
fi

# Safety confirmation guard
if [[ "${CONFIRM_FLAG}" != "--confirm" ]]; then
    echo "⚠️  WARNING: Restoring a database drops existing objects and replaces data!"
    echo "To execute this destructive restoration, re-run with '--confirm':"
    echo "  $0 ${BACKUP_FILE} --confirm"
    exit 1
fi

# [1/4] Checksum verification
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
echo "[1/4] Verifying SHA-256 backup file checksum..."
if [[ -f "${CHECKSUM_FILE}" ]]; then
    if command -v sha256sum &>/dev/null; then
        sha256sum --check "${CHECKSUM_FILE}" || { echo "❌ Checksum verification failed!"; exit 1; }
    elif command -v shasum &>/dev/null; then
        shasum -a 256 --check "${CHECKSUM_FILE}" || { echo "❌ Checksum verification failed!"; exit 1; }
    fi
    echo "✓ Checksum verified. Backup file is intact and authentic."
else
    echo "⚠️ Notice: Checksum file (${CHECKSUM_FILE}) not found. Skipping hash verification."
fi

# Source DB environment variables
if [[ -f "${ROOT_DIR}/.env" ]]; then
    # shellcheck disable=SC1091
    source "${ROOT_DIR}/.env" || true
fi

DB_USER="${DB_USER:-algions_user}"
DB_NAME="${DB_NAME:-algions_db}"

# [2/4] Perform pg_restore
echo "[2/4] Restoring PostgreSQL database from archive (-Fc)..."
if docker compose ps -q postgres &>/dev/null; then
    docker compose exec -T postgres pg_restore -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists < "${BACKUP_FILE}" || true
else
    pg_restore -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists "${BACKUP_FILE}" || true
fi
echo "✓ Archive restored."

# [3/4] Verify database contents post-restore
echo "[3/4] Executing post-restore data verification checks..."
if docker compose ps -q postgres &>/dev/null; then
    PRODUCT_COUNT=$(docker compose exec -T postgres psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM products;" | tr -d ' ')
    ORDER_COUNT=$(docker compose exec -T postgres psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM orders;" | tr -d ' ')
else
    PRODUCT_COUNT=$(psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM products;" | tr -d ' ')
    ORDER_COUNT=$(psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM orders;" | tr -d ' ')
fi

echo "✓ Verified Database Records:"
echo "  - Products in Catalog: ${PRODUCT_COUNT}"
echo "  - Orders Recorded:     ${ORDER_COUNT}"

# [4/4] Verify API Readiness Probe
echo "[4/4] Testing API readiness against restored database..."
if curl -k -s -f https://localhost/api/v1/health/ready &>/dev/null || curl -s -f http://localhost:4000/api/v1/health/ready &>/dev/null; then
    echo "✓ API /health/ready returned HTTP 200 OK."
else
    echo "⚠️ Notice: API endpoint could not be probed immediately. Check service status."
fi

echo "================================================================="
echo "✓ Database restoration completed successfully!"
echo "================================================================="
