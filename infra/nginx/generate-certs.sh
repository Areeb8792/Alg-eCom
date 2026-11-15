#!/usr/bin/env bash
# ==============================================================================
# Generate Self-Signed Development / Staging TLS Certificates for Nginx
# ==============================================================================
set -Eeuo pipefail
export MSYS_NO_PATHCONV=1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="${SCRIPT_DIR}/ssl"
DOMAIN="${1:-${SERVER_NAME:-localhost}}"

mkdir -p "${SSL_DIR}/live"

if [[ -f "${SSL_DIR}/live/fullchain.pem" && -f "${SSL_DIR}/live/privkey.pem" && "${DOMAIN}" == "localhost" ]]; then
    echo "✓ TLS certificates already exist in ${SSL_DIR}/live"
    exit 0
fi

echo "Generating self-signed RSA 2048-bit TLS certificate for ${DOMAIN}..."

cd "${SSL_DIR}"

MSYS_NO_PATHCONV=1 openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout server.key \
    -out server.crt \
    -subj "/C=US/ST=New York/L=New York/O=HEAVYWEIGHT/OU=DevOps/CN=${DOMAIN}" \
    -addext "subjectAltName=DNS:${DOMAIN},DNS:localhost,IP:127.0.0.1" 2>/dev/null || \
MSYS_NO_PATHCONV=1 openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout server.key \
    -out server.crt \
    -subj "/C=US/ST=New York/L=New York/O=HEAVYWEIGHT/OU=DevOps/CN=${DOMAIN}"

chmod 600 server.key || true
chmod 644 server.crt || true

# Copy into live/ for Nginx consumption
cp server.crt "${SSL_DIR}/live/fullchain.pem"
cp server.key "${SSL_DIR}/live/privkey.pem"
chmod 644 "${SSL_DIR}/live/fullchain.pem" || true
chmod 600 "${SSL_DIR}/live/privkey.pem" || true

echo "✓ TLS certificates successfully generated in ${SSL_DIR}/live for ${DOMAIN}"
