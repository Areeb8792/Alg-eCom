#!/usr/bin/env bash
# ==============================================================================
# Algions Platform — Automated Let's Encrypt TLS Provisioning & Renewal Setup
# Target Architecture: Ubuntu 24.04 VPS with Docker Compose & Nginx
# ==============================================================================
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

# Source environment
if [[ -f "${ROOT_DIR}/.env" ]]; then
    # shellcheck disable=SC1091
    source "${ROOT_DIR}/.env" || true
fi

SERVER_NAME="${SERVER_NAME:-localhost}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
CERTBOT_STAGING="${CERTBOT_STAGING:-0}"
SSL_DIR="${ROOT_DIR}/infra/nginx/ssl"

echo "================================================================="
echo "   Algions Platform — Production TLS Provisioning (Let's Encrypt)"
echo "   Target Domain: ${SERVER_NAME}                                 "
echo "================================================================="

if [[ "${SERVER_NAME}" == "localhost" || "${SERVER_NAME}" == "127.0.0.1" ]]; then
    echo "Notice: SERVER_NAME is set to '${SERVER_NAME}' (local development)."
    echo "Let's Encrypt requires a publicly resolvable DNS domain."
    echo "Falling back to self-signed development certificates..."
    bash "${ROOT_DIR}/infra/nginx/generate-certs.sh" "${SERVER_NAME}"
    echo "✓ Development TLS certificates configured for localhost."
    exit 0
fi

if [[ -z "${CERTBOT_EMAIL}" ]]; then
    echo "❌ FATAL: CERTBOT_EMAIL is not set in .env. A valid administrator email is required for Let's Encrypt notifications."
    exit 1
fi

echo "[1/4] Ensuring emergency fallback certificate exists so Nginx can boot..."
mkdir -p "${SSL_DIR}/live"
if [[ ! -f "${SSL_DIR}/live/fullchain.pem" || ! -f "${SSL_DIR}/live/privkey.pem" ]]; then
    bash "${ROOT_DIR}/infra/nginx/generate-certs.sh" "${SERVER_NAME}"
fi

echo "[2/4] Starting Nginx to answer ACME HTTP-01 challenge on port 80..."
docker compose up -d nginx

# Let's Encrypt staging flag (avoids rate limits when testing VPS deployments)
STAGING_FLAG=""
if [[ "${CERTBOT_STAGING}" != "0" ]]; then
    echo "⚠️ Warning: CERTBOT_STAGING is enabled. Issuing certificates against Let's Encrypt Staging environment."
    STAGING_FLAG="--staging"
fi

echo "[3/4] Requesting Let's Encrypt certificate for ${SERVER_NAME} via ACME webroot..."
docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    ${STAGING_FLAG} \
    --email ${CERTBOT_EMAIL} \
    -d ${SERVER_NAME} \
    --rsa-key-size 4096 \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    --non-interactive" certbot

echo "[4/4] Installing active Let's Encrypt certificates and reloading Nginx..."
docker compose run --rm --entrypoint "\
  sh -c 'cp -L /etc/letsencrypt/live/${SERVER_NAME}/fullchain.pem /etc/nginx/ssl/live/fullchain.pem && \
         cp -L /etc/letsencrypt/live/${SERVER_NAME}/privkey.pem /etc/nginx/ssl/live/privkey.pem && \
         chmod 644 /etc/nginx/ssl/live/fullchain.pem && \
         chmod 600 /etc/nginx/ssl/live/privkey.pem'" certbot

docker compose exec nginx nginx -s reload

echo "================================================================="
echo "✓ Trusted Let's Encrypt TLS certificate active for: https://${SERVER_NAME}"
echo "================================================================="
