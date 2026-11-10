# ==============================================================================
# Algions Luxury Fashion Web Frontend — Production Multi-Stage Dockerfile
# ==============================================================================

# Stage 1: Build & Compile React SPA
FROM node:24.22.2-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json tsconfig.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
RUN npm ci

COPY src/ ./src/

# Compile production static bundle to /dist
RUN npm run build

# Stage 2: Production Nginx Server (Maintained Stable Release)
FROM nginx:1.30.6-alpine AS runner

# Remove default boilerplate configuration
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copy compiled static assets from builder
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Copy reverse proxy and security configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Create directory for local SSL certificates
RUN mkdir -p /etc/nginx/ssl

EXPOSE 80 443

HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
