# ==============================================================================
# Algions Luxury Fashion Web Frontend — Production Multi-Stage Dockerfile (Monorepo Root Context)
# ==============================================================================

# Stage 1: Build & Compile React SPA
FROM node:24.22.2-alpine AS builder

WORKDIR /usr/src/app

# Copy root manifest and authoritative lockfile
COPY package.json package-lock.json ./
# Copy workspace manifests
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Clean install all dependencies needed for build
RUN npm ci

# Copy web frontend build configuration and source
COPY apps/web/tsconfig.json apps/web/vite.config.ts apps/web/tailwind.config.js apps/web/postcss.config.js apps/web/index.html ./apps/web/
COPY apps/web/src/ ./apps/web/src/

# Compile production static bundle to apps/web/dist
RUN npm run build --workspace=@algions/web

# Stage 2: Production Nginx Server (Maintained Stable Release)
FROM nginx:1.30.6-alpine AS runner

# Install OpenSSL and Bash for runtime cert management
RUN apk add --no-cache openssl bash

# Remove default boilerplate configuration
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copy compiled static assets from builder
COPY --from=builder /usr/src/app/apps/web/dist /usr/share/nginx/html

# Copy reverse proxy and security configuration
COPY infra/nginx/nginx.conf /etc/nginx/nginx.conf
COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY infra/nginx/templates/default.conf.template /etc/nginx/templates/default.conf.template

# Create directories for SSL certificates and Let's Encrypt webroot
RUN mkdir -p /etc/nginx/ssl/live /var/www/certbot

COPY apps/web/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80 443

HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider --no-check-certificate https://localhost/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
