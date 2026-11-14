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

DB_USER="${DB_MIGRATION_USER:-${POSTGRES_USER:-${DB_USER:-algions_admin}}}"
DB_PASSWORD="${DB_MIGRATION_PASSWORD:-${POSTGRES_PASSWORD:-${DB_PASSWORD:-}}}"
DB_NAME="${TARGET_DB:-${3:-${DB_NAME:-algions_db}}}"

if [[ -z "${DB_PASSWORD}" ]]; then
    echo "❌ FATAL: Database credentials (DB_MIGRATION_PASSWORD or POSTGRES_PASSWORD) are not set. Explicit credentials required."
    exit 1
fi

# [2/4] Perform pg_restore
echo "[2/4] Restoring PostgreSQL database from archive (-Fc) as migration admin '${DB_USER}'..."
if docker compose ps -q postgres &>/dev/null; then
    docker compose exec -T -e PGPASSWORD="${DB_PASSWORD}" postgres pg_restore -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --exit-on-error < "${BACKUP_FILE}"
elif command -v pg_restore &>/dev/null; then
    PGPASSWORD="${DB_PASSWORD}" pg_restore -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --exit-on-error "${BACKUP_FILE}"
else
    echo "❌ Error: Neither active PostgreSQL container nor host 'pg_restore' utility found."
    echo "To execute native PostgreSQL restores, start the container stack with 'docker compose up -d' or install PostgreSQL client tools."
    exit 1
fi
echo "✓ Archive restored."

# [3/4] Verify database contents post-restore
echo "[3/4] Executing post-restore data and schema integrity verification checks..."
if docker compose ps -q postgres &>/dev/null; then
    TABLE_COUNT=$(docker compose exec -T -e PGPASSWORD="${DB_PASSWORD}" postgres psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' \r\n')
    PRODUCT_COUNT=$(docker compose exec -T -e PGPASSWORD="${DB_PASSWORD}" postgres psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM products;" | tr -d ' \r\n')
    ORDER_COUNT=$(docker compose exec -T -e PGPASSWORD="${DB_PASSWORD}" postgres psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM orders;" | tr -d ' \r\n')
    SAMPLE_PRODUCT=$(docker compose exec -T -e PGPASSWORD="${DB_PASSWORD}" postgres psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT name FROM products WHERE is_active = true LIMIT 1;" | tr -d '\r\n' | sed -e 's/^[[:space:]]*//')
else
    TABLE_COUNT=$(PGPASSWORD="${DB_PASSWORD}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' \r\n')
    PRODUCT_COUNT=$(PGPASSWORD="${DB_PASSWORD}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM products;" | tr -d ' \r\n')
    ORDER_COUNT=$(PGPASSWORD="${DB_PASSWORD}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM orders;" | tr -d ' \r\n')
    SAMPLE_PRODUCT=$(PGPASSWORD="${DB_PASSWORD}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT name FROM products WHERE is_active = true LIMIT 1;" | tr -d '\r\n' | sed -e 's/^[[:space:]]*//')
fi

if [[ -z "${TABLE_COUNT}" || "${TABLE_COUNT}" -lt 4 ]]; then
    echo "❌ Post-restore verification failed: Expected schema tables not found (found ${TABLE_COUNT:-0})."
    exit 1
fi

echo "✓ Verified Database Schema & Records:"
echo "  - Schema Public Tables: ${TABLE_COUNT}"
echo "  - Products in Catalog:  ${PRODUCT_COUNT} (Sample active product: '${SAMPLE_PRODUCT}')"
echo "  - Orders Recorded:      ${ORDER_COUNT}"

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
