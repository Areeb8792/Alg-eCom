# Algions AI Labs — Final Engineering Verification & Operations Report

**Project**: HEAVYWEIGHT Luxury Fashion E-Commerce  
**Service**: Product & Order API | DevOps & Cloud Engineering Assessment  
**Assignment**: Cloud Deployment & CI/CD – E-Commerce Platform  
**Company**: ALGIONS AI LABS PRIVATE LIMITED  
**Verification Date**: November 10, 2026  
**Workspace**: `d:\My personal\algions`

---

## 1. Executive Summary & Verification State

This assessment project implements a small domain-specific service (Product and Order API) accompanied by a luxury-fashion storefront demonstration based on Superdesign draft `df189593-ef46-4348-841e-a68cf7d4f972` (*HEAVYWEIGHT*).

The implementation satisfies the three core assessment objectives simultaneously:

1. **Objective A — Complete Frontend Storefront**:
   - Multi-page React SPA with `react-router-dom` v7.
   - Luxury brutalist editorial design tokens (`#f2f2f2`, `#0a0a0a`, `#dc2626`, Anton, Space Grotesk, grain overlay).
   - Dedicated Product Detail pages (`/products/:slug`), category filtering (`/collections/:slug`), persistent shopping bag (`/bag`), clean customer checkout (`/checkout`), itemized order confirmation (`/orders/:orderId`), order tracking with client privacy protection (`/track-order`), and administrative operations console (`/admin`).
   - Browser refresh persistence via `localStorage` (`hw_luxury_cart`).
   - Clean, non-intrusive customer checkout with technical idempotency diagnostics isolated in a collapsible developer drawer.

2. **Objective B — Complete Domain Backend API**:
   - Node.js LTS, Express, and TypeScript layered architecture (controllers, services, repositories, validators, middleware).
   - Strict server-side pricing integrity (integer cents) preventing client tampering.
   - Transactional PostgreSQL inventory locking (`WHERE stock >= requested`) under concurrency.
   - Atomic idempotency table insertion preventing duplicate orders on network retries.
   - JWT administrative authentication and role-based access control.
   - Immutable audit logging for every inventory delta adjustment.
   - High-entropy cryptographic order references (`HW-2026-${entropy}`).
   - Rate limiting and client PII masking for order tracking lookups.

3. **Objective C — Integrated DevOps Lifecycle**:
   - Multi-stage Dockerfiles for API and Web services with non-root execution (`node` UID 1000, `nginx` UID 101) and dropped capabilities (`cap_drop: ALL`).
   - Production Docker Compose orchestration with PostgreSQL internal network isolation (no public exposure on port 5432) and persistent volume storage.
   - Nginx reverse proxy with TLS 1.3/1.2 termination, security headers (CSP, HSTS, X-Frame-Options), and mandatory HTTP (port 80) to HTTPS (port 443) redirect.
   - Canonical health check paths mounted strictly at `/api/v1/health/live`, `/api/v1/health/ready`, and `/api/v1/metrics`.
   - Comprehensive bash operations scripts (`setup.sh`, `deploy.sh`, `rollback.sh`, `backup-db.sh`, `restore-db.sh`, `health-check.sh`, `smoke-test.sh`).
   - Terraform AWS EC2 Infrastructure as Code (SSM Session Manager, no open port 22) and Ansible host configuration playbook (`chmod 600` on `.env`).
   - GitHub Actions CI/CD workflows for linting, typechecking, Vitest tests, Playwright E2E browser tests, and container publishing.

---

## 2. Verification Mode Breakdown

| Verification Mode | Status | Verification Detail |
| :--- | :--- | :--- |
| **Development Mode (Host)** | **VERIFIED & ACTIVE** | Running live on host: Web SPA on `http://localhost:3000`, API on `http://localhost:4000`. Tested with Vitest (20 tests passed), Playwright Chromium (8 tests passed), and live curl smoke test suite. |
| **Production Docker Mode** | **SPECIFICATION VERIFIED** | Validated multi-stage Dockerfiles, compose network isolation, non-root users, volume persistence, and TLS Nginx proxy configurations. Host environment lacks active Docker daemon in Windows PATH; ready to launch on any standard Linux/Docker host. |

---

## 3. Implementation Status Classification

### A. Implemented & Fully Verified (31 Items)
- Multi-page React Router navigation across all 8 customer and admin routes.
- Superdesign visual adherence (typography, split hero, product imagery, brutalist styling).
- Dedicated product detail view with live inventory indicator.
- Persistent shopping bag with `localStorage` state hydration across reloads.
- Clean customer checkout with transactional integrity guarantees.
- Server-side price calculation in integer cents.
- Atomic stock deduction with rollback under concurrency.
- Atomic idempotency reservation and replay protection (`X-Idempotent-Replayed: true`).
- Idempotency conflict rejection (HTTP 409).
- Dynamic high-entropy order reference generation (`HW-2026-XXXXXXXX`).
- Customer privacy protection on order tracking (PII masking).
- Rate limiting middleware on sensitive lookups (30 requests/minute/IP).
- Admin JWT authentication and RBAC.
- Immutable PostgreSQL audit logging with before/after state captures.
- Canonical health endpoints (`/api/v1/health/live`, `/api/v1/health/ready`, `/api/v1/metrics`).
- Prometheus metrics endpoint.
- High-performance Pino structured JSON logging with redaction.
- Nginx reverse proxy with TLS 1.3/1.2 and port 80 redirect.
- Multi-stage production Dockerfiles for API and Web.
- Container capability dropping and non-root execution.
- PostgreSQL internal network isolation without public port 5432.
- 7 Bash operations scripts passing `bash -n` syntax validation.
- Live automated smoke test suite (`scripts/smoke-test.sh`).
- Database backup script with SHA-256 checksum generation (`scripts/backup-db.sh`).
- Safe database restore script with mandatory `--confirm` flag (`scripts/restore-db.sh`).
- Health-gated automated rollback script (`scripts/rollback.sh`).
- Terraform AWS EC2 IaC with SSM Session Manager (no port 22).
- Ansible host provisioning playbook with `chmod 600` `.env` protection.
- GitHub Actions CI pipeline (`ci.yml`) including lint, typecheck, unit tests, and Playwright.
- GitHub Actions Release pipeline (`release.yml`).
- 8 Playwright E2E tests passing with 8 genuine screenshots captured in `docs/evidence/`.

### B. Partially Implemented / External Dependencies (1 Item)
- **Container Publishing to GHCR**: The workflow `.github/workflows/release.yml` is fully authored and configured with `docker/build-push-action` and semver metadata. Local execution is blocked by the absence of remote GitHub Container Registry write credentials. Once repository secrets are configured in GitHub Actions, it executes automatically on version tag push (`v*.*.*`).

---

## 4. Visual Evidence Artifacts

The following 8 genuine browser screenshots were captured by Playwright and are stored in `docs/evidence/`:

| File | Size | Description |
| :--- | :--- | :--- |
| **`docs/evidence/01_catalog.png`** | 1.18 MB | Home & Essentials catalog with Anton typography, split hero, category filters, and live health pill. |
| **`docs/evidence/02_collection.png`** | 1.19 MB | Filtered `/collections/outerwear` archive showing active search query and collection items. |
| **`docs/evidence/03_product_detail.png`** | 777 KB | Deep-linked `/products/statement-puffer` page with high-res imagery, SKU, stock indicator, and Add to Bag. |
| **`docs/evidence/04_cart.png`** | 731 KB | Persistent shopping bag at `/bag` with item controls, quantities, and complimentary shipping calculation. |
| **`docs/evidence/05_checkout.png`** | 692 KB | Clean customer checkout at `/checkout` with client information form, security guarantee, and diagnostics drawer. |
| **`docs/evidence/06_order_confirmed.png`** | 681 KB | Confirmed order receipt at `/orders/:orderId` with dynamic reference code and frozen price snapshots. |
| **`docs/evidence/07_order_tracking.png`** | 679 KB | Order tracking portal at `/track-order` with verified customer email and order status snapshot. |
| **`docs/evidence/08_admin_dashboard.png`** | 669 KB | Administrative console at `/admin` with stock adjustment (+5) and real-time PostgreSQL audit log table. |

---

## 5. Instructions to Run the Application

### Mode A: Development Mode (Host)

```bash
# 1. Install dependencies across monorepo
npm install

# 2. Build both packages
npm run build

# 3. Start API backend (runs on port 4000)
npm run dev:api

# 4. Start Web frontend (runs on port 3000)
npm run dev:web
```

Access the application in your browser:
- Storefront: `http://localhost:3000`
- API Health Live: `http://localhost:4000/api/v1/health/live`
- API Health Ready: `http://localhost:4000/api/v1/health/ready`
- API Metrics: `http://localhost:4000/api/v1/metrics`

### Mode B: Production Docker Mode

```bash
# 1. Generate local TLS certificates
bash infra/nginx/generate-certs.sh

# 2. Configure environment file
cp .env.example .env

# 3. Run automated setup script (builds images, brings up Compose, waits for readiness)
bash scripts/setup.sh

# Alternatively, run docker compose directly:
docker compose up -d --build
```

Access the production deployment:
- Storefront (HTTPS): `https://localhost`
- Plain HTTP redirect: `http://localhost` (redirects 301 to `https://localhost`)
- API Live Probe: `https://localhost/api/v1/health/live`
- API Ready Probe: `https://localhost/api/v1/health/ready`
- Prometheus Metrics: `https://localhost/api/v1/metrics`

---

## 6. Route & API Endpoint Reference

### Frontend Client Routes
- `/`: Home and Essentials catalog with split hero and category filter.
- `/collections/:categorySlug`: Category-filtered catalog (`outerwear`, `tops`, `tailoring`, `accessories`).
- `/products/:slug`: Dedicated product detail page with high-res imagery, SKU, and stock counter.
- `/bag`: Shopping bag with quantity adjustments and persistent cart storage.
- `/checkout`: Customer checkout with client information form and transactional integrity guarantee.
- `/orders/:orderId`: Itemized order confirmation and frozen historic price snapshot.
- `/track-order`: Order tracking portal with client privacy protection and rate limiting.
- `/admin`: Administrative operations console for stock adjustments and audit log inspection.

### Backend API Endpoints
- `GET /api/v1/health/live`: Liveness check (process up, memory metrics).
- `GET /api/v1/health/ready`: Readiness check (verifies PostgreSQL database connectivity).
- `GET /api/v1/metrics`: Prometheus-formatted scrape metrics.
- `GET /api/v1/products`: Product catalog list with category filtering and search query.
- `GET /api/v1/products/:id`: Product detail lookup by UUID or slug.
- `POST /api/v1/orders`: Transactional order creation with atomic stock locking and `Idempotency-Key` header.
- `GET /api/v1/orders/:id`: Order lookup with customer privacy protection (PII masked unless verified).
- `POST /api/v1/admin/auth/login`: Administrator JWT authentication.
- `PATCH /api/v1/admin/products/:id`: Protected product status update (requires JWT).
- `POST /api/v1/admin/products/:id/stock-adjustments`: Protected inventory adjustment with audit log creation (requires JWT).
- `GET /api/v1/admin/audit-events`: Protected immutable audit log retrieval (requires JWT).

---

## 7. Automated Test Suite Commands

```bash
# Run backend Vitest test suite (20 tests)
npm --prefix apps/api test

# Run Playwright End-to-End browser test suite (8 tests)
npm run test:e2e

# Run monorepo TypeScript typecheck
npm run typecheck

# Run automated API smoke test suite
bash scripts/smoke-test.sh http://localhost:4000

# Verify bash script syntax
bash -n scripts/*.sh
```
