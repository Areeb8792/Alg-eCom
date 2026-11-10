#!/usr/bin/env bash
# ==============================================================================
# Generate Self-Signed Development / Staging TLS Certificates for Nginx
# ==============================================================================
set -Eeuo pipefail
export MSYS_NO_PATHCONV=1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="${SCRIPT_DIR}/ssl"

mkdir -p "${SSL_DIR}"

if [[ -f "${SSL_DIR}/server.crt" && -f "${SSL_DIR}/server.key" ]]; then
    echo "✓ TLS certificates already exist in ${SSL_DIR}"
    exit 0
fi

echo "Generating self-signed RSA 2048-bit TLS certificate for localhost..."

cd "${SSL_DIR}"

MSYS_NO_PATHCONV=1 openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout server.key \
    -out server.crt \
    -subj "/C=US/ST=New York/L=New York/O=HEAVYWEIGHT/OU=DevOps/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

chmod 600 server.key || true
chmod 644 server.crt || true

echo "✓ TLS certificates successfully generated in ${SSL_DIR}"
