# ==============================================================================
# Algions Product & Order API — Production Multi-Stage Dockerfile (Monorepo Root Context)
# ==============================================================================

# Stage 1: Build & Compile TypeScript
FROM node:24.22.2-alpine AS builder

WORKDIR /usr/src/app

# Copy root manifest and authoritative lockfile
COPY package.json package-lock.json ./
# Copy workspace manifests required by npm workspaces
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Clean install all dependencies using monorepo lockfile
RUN npm ci

# Copy API workspace source and configuration
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/src/ ./apps/api/src/

# Compile TypeScript to JavaScript in apps/api/dist
RUN npm run build --workspace=@algions/api

# Stage 2: Production Minimal Runtime
FROM node:24.22.2-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Copy root manifest and authoritative lockfile
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install only the API's required production dependencies
RUN npm ci --omit=dev --workspace=@algions/api --include-workspace-root && npm cache clean --force

# Copy compiled files and SQL schema from builder stage
COPY --from=builder /usr/src/app/apps/api/dist ./apps/api/dist
COPY --from=builder /usr/src/app/apps/api/src/database/schema.sql ./apps/api/dist/database/schema.sql

# Set correct non-root permissions for node user (UID 1000)
RUN chown -R node:node /usr/src/app

USER node

EXPOSE 4000

WORKDIR /usr/src/app/apps/api

# Docker native container health check against the liveness probe
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:4000/api/v1/health/live', (r) => process.exit(r.statusCode === 200 ? 0 : 1));"

CMD ["node", "dist/index.js"]
