#!/usr/bin/env bash
# ==============================================================================
# Algions Platform — Database Backup Routine (pg_dump with SHA-256 Checksum)
# ==============================================================================
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-${ROOT_DIR}/backups}"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.dump"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

mkdir -p "${BACKUP_DIR}"

echo "================================================================="
echo "   Algions AI Labs — PostgreSQL Database Backup Routine          "
echo "   Output Destination: ${BACKUP_FILE}                            "
echo "================================================================="

# Source DB environment variables if .env exists
if [[ -f "${ROOT_DIR}/.env" ]]; then
    # shellcheck disable=SC1091
    source "${ROOT_DIR}/.env" || true
fi

DB_BACKUP_USER="${DB_BACKUP_USER:-algions_backup}"
DB_BACKUP_PASSWORD="${DB_BACKUP_PASSWORD:-algions_backup_password}"
DB_NAME="${DB_NAME:-algions_db}"

echo "[1/4] Executing pg_dump in compressed custom archive format (-Fc) as role '${DB_BACKUP_USER}'..."

if docker compose ps -q postgres &>/dev/null; then
    docker compose exec -T -e PGPASSWORD="${DB_BACKUP_PASSWORD}" postgres pg_dump -U "${DB_BACKUP_USER}" -d "${DB_NAME}" -Fc > "${BACKUP_FILE}"
elif command -v pg_dump &>/dev/null; then
    PGPASSWORD="${DB_BACKUP_PASSWORD}" pg_dump -U "${DB_BACKUP_USER}" -d "${DB_NAME}" -Fc -f "${BACKUP_FILE}"
else
    echo "❌ Error: Neither active PostgreSQL container nor host 'pg_dump' utility found."
    echo "To execute native PostgreSQL backups, start the container stack with 'docker compose up -d' or install PostgreSQL client tools."
    exit 1
fi

# [2/4] Verify file existence and non-empty status
echo "[2/4] Verifying backup file integrity..."
if [[ ! -s "${BACKUP_FILE}" ]]; then
    echo "❌ Error: Backup file is missing or empty (0 bytes). Aborting."
    rm -f "${BACKUP_FILE}"
    exit 1
fi

FILESIZE=$(wc -c < "${BACKUP_FILE}" | tr -d ' ')
echo "✓ Backup created successfully (${FILESIZE} bytes)."

# [3/4] Generate SHA-256 Checksum
echo "[3/4] Generating cryptographic SHA-256 checksum..."
if command -v sha256sum &>/dev/null; then
    sha256sum "${BACKUP_FILE}" > "${CHECKSUM_FILE}"
elif command -v shasum &>/dev/null; then
    shasum -a 256 "${BACKUP_FILE}" > "${CHECKSUM_FILE}"
else
    openssl dgst -sha256 "${BACKUP_FILE}" > "${CHECKSUM_FILE}"
fi
echo "✓ Checksum recorded in: ${CHECKSUM_FILE}"

# [4/4] Retention policy — Retain backups from last 7 days, prune older
echo "[4/4] Applying 7-day retention cleanup..."
find "${BACKUP_DIR}" -name "db_backup_*.dump*" -type f -mtime +7 -delete 2>/dev/null || true

echo "================================================================="
echo "✓ Backup process completed successfully!"
echo "File:     ${BACKUP_FILE}"
echo "Checksum: $(cat "${CHECKSUM_FILE}")"
echo "================================================================="
