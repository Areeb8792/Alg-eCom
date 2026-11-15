#!/bin/sh
set -e

# ==============================================================================
# Algions Web & Reverse Proxy — Container Entrypoint
# Dynamically configures SERVER_NAME and bootstraps fallback SSL if missing
# ==============================================================================

SERVER_NAME="${SERVER_NAME:-localhost}"
export SERVER_NAME

mkdir -p /etc/nginx/ssl/live /var/www/certbot

# 1. Fallback SSL Certificate Bootstrap
# If certificates are missing from /etc/nginx/ssl/live, generate an emergency self-signed cert
# to ensure Nginx boots cleanly and can answer ACME challenge requests on port 80.
if [ ! -f /etc/nginx/ssl/live/fullchain.pem ] || [ ! -f /etc/nginx/ssl/live/privkey.pem ]; then
    echo "Notice: No TLS certificate found in /etc/nginx/ssl/live/."
    echo "Generating temporary self-signed TLS certificate for '${SERVER_NAME}'..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/live/privkey.pem \
        -out /etc/nginx/ssl/live/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=HEAVYWEIGHT/OU=DevOps/CN=${SERVER_NAME}" \
        -addext "subjectAltName=DNS:${SERVER_NAME},DNS:localhost,IP:127.0.0.1" 2>/dev/null || true
    chmod 600 /etc/nginx/ssl/live/privkey.pem || true
    chmod 644 /etc/nginx/ssl/live/fullchain.pem || true
fi

# 2. Template substitution for Nginx server block
if [ -f /etc/nginx/templates/default.conf.template ]; then
    echo "Rendering /etc/nginx/conf.d/default.conf with SERVER_NAME='${SERVER_NAME}'..."
    envsubst '${SERVER_NAME}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
fi

exec "$@"
