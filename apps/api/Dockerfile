# ==============================================================================
# Algions Product & Order API — Production Multi-Stage Dockerfile
# ==============================================================================

# Stage 1: Build & Compile TypeScript
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies needed for compilation
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy source code and database migrations
COPY src/ ./src/

# Compile TypeScript to JavaScript in /dist
RUN npm run build

# Stage 2: Production Minimal Runtime
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled files and SQL schema from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/database/schema.sql ./dist/database/schema.sql

# Set correct non-root permissions for node user (UID 1000)
RUN chown -R node:node /usr/src/app

USER node

EXPOSE 4000

# Docker native container health check against the liveness probe
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:4000/api/v1/health/live', (r) => process.exit(r.statusCode === 200 ? 0 : 1));"

CMD ["node", "dist/index.js"]
