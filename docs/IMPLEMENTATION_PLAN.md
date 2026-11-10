# Algions AI Labs — Cloud Deployment & CI/CD E-Commerce Platform
## Comprehensive Implementation Plan & Engineering Design

- **Company**: ALGIONS AI LABS PRIVATE LIMITED
- **Project**: Cloud Deployment & CI/CD – E-Commerce Platform
- **Service Assigned**: Product and Order API
- **Design System Reference**: Superdesign Project `7f696042-42df-4c14-a518-cf97a2601743` ("HEAVYWEIGHT - Luxury Fashion E-commerce"), Draft `df189593-ef46-4348-841e-a68cf7d4f972`

---

## 1. Existing Repository Analysis
- **Initial State**: Empty directory initialized with Git repository.
- **Requirements**:
  - Small, high-fidelity luxury fashion domain (HEAVYWEIGHT aesthetic).
  - Production-style architecture with clear separation: API backend (`apps/api`), web frontend (`apps/web`), infrastructure (`infra/`), operational automation scripts (`scripts/`), and comprehensive documentation (`docs/`).
  - No bloated marketplace features; laser-focused on reliable catalog, transactional order creation with strict stock locking, idempotency guarantees, protected admin operations with audit logs, and DevOps operational excellence.

---

## 2. Superdesign Components and Design Tokens
- **Design Draft**: `df189593-ef46-4348-841e-a68cf7d4f972` + 4 linked drafts (`a5026836-5052-4be0-a86c-3d191fe8636f` Product Detail, `c5f89dad-bd19-42fa-8528-34077707781e` Cart, `5327de83-3a28-4cce-8fce-aa491fb68cfa` Checkout, `b4568d60-3f05-4a11-8edb-5ad3b31d87fd` Order Confirmation).
- **Core Design Tokens**:
  - Background Canvas: `--concrete: #f2f2f2`
  - Deep Ink / Primary Text & Dark Sections: `--ink: #0a0a0a`
  - Accent Red: `--red: #dc2626`
  - Font Families: `'Anton', sans-serif` (ultra-condensed brutalist headings) and `'Space Grotesk', sans-serif` (monospace-influenced high-fashion body/metadata).
  - Visual Elements: Fixed grain texture overlay (`opacity: 0.04`), sharp unblurred drop-shadows (`box-shadow: 10px 10px 0px rgba(0,0,0,0.1)`), grayscale images with colored hover reveal, and `mix-blend-mode: difference` navigation bar.

---

## 3. Design-to-Code Mapping
| Superdesign Screen / Element | Implementation Component | API Integration |
| :--- | :--- | :--- |
| Hero Section + Essentials Strip | `apps/web/src/pages/CatalogPage.tsx` | `GET /api/v1/products` |
| Product Detail Modal / View | `apps/web/src/pages/ProductDetailPage.tsx` | `GET /api/v1/products/:id` |
| Floating Bag & Checkout Drawer | `apps/web/src/pages/CheckoutPage.tsx` | `POST /api/v1/orders` (with `Idempotency-Key`) |
| Order Confirmation Screen | `apps/web/src/pages/OrderConfirmationPage.tsx` | `GET /api/v1/orders/:id` |
| Admin / Inventory Ops Panel | `apps/web/src/pages/AdminPage.tsx` | `POST /api/v1/admin/auth/login`, `PATCH /api/v1/admin/products/:id`, `POST /api/v1/admin/products/:id/stock-adjustments`, `GET /api/v1/admin/audit-events` |
| DevOps Health Signal Banner | `apps/web/src/components/HealthSignal.tsx` | `GET /api/v1/health/live`, `GET /api/v1/health/ready` |

---

## 4. Frontend Component Hierarchy
```text
App
├── StorefrontLayout
│   ├── GrainOverlay (Fixed SVG noise)
│   ├── MainHeader (Anton logo, navigation links with strikethrough, difference blend)
│   ├── FloatingCartButton (Badge count, trigger drawer/page)
│   ├── Routes:
│   │   ├── CatalogPage (Hero split, horizontal product strip, collection grid)
│   │   ├── ProductDetailPage (Editorial zoom, SKU snapshot, stock state, quantity picker)
│   │   ├── CheckoutPage (Order review, contact input, UUID Idempotency-Key generator)
│   │   ├── OrderConfirmationPage (Order ref, status badge, item snapshot, financial breakdown)
│   │   └── AdminPage (Protected JWT login, stock adjustment modal, audit table)
│   └── MainFooter (Newsletter input, site map, watermark background title)
```

---

## 5. Backend & Database Architecture
- **Runtime**: Node.js LTS, TypeScript, Express.js.
- **Database**: PostgreSQL with pooled connection management via `pg`.
- **Financial Safety**: All monetary values represented as integer minor units (cents, e.g. `$140.00` = `14000`), completely eliminating floating-point rounding bugs.
- **Schema**:
  - `products`: `id` (UUID PK), `sku` (UNIQUE), `slug` (UNIQUE), `name`, `description`, `category`, `price_cents` (INT), `currency` (VARCHAR 3), `stock` (INT with `CHECK (stock >= 0)`), `is_active` (BOOLEAN), `image_url`, `created_at`, `updated_at`.
  - `orders`: `id` (UUID PK), `order_reference` (UNIQUE VARCHAR, e.g. `HW-2024-XXXX`), `customer_email`, `customer_name`, `status` (VARCHAR: `PENDING`, `CONFIRMED`, `CANCELLED`), `subtotal_cents`, `currency`, `created_at`, `updated_at`.
  - `order_items`: `id` (UUID PK), `order_id` (FK `orders.id`), `product_id` (FK `products.id`), `quantity` (INT > 0), `product_name_snapshot`, `sku_snapshot`, `unit_price_cents_snapshot`, `currency_snapshot`.
  - `idempotency_keys`: `key` (VARCHAR PK), `request_hash` (VARCHAR 64 SHA-256), `status` (VARCHAR: `IN_PROGRESS`, `RESOLVED`, `FAILED`), `order_id` (FK nullable), `response_code` (INT), `response_body` (JSONB), `created_at`, `updated_at`.
  - `admin_users`: `id` (UUID PK), `username` (UNIQUE), `password_hash` (bcrypt), `role` (`ADMIN`), `created_at`.
  - `audit_events`: `id` (UUID PK), `actor_id` (UUID), `actor_username`, `action` (VARCHAR), `resource_type` (VARCHAR), `resource_id` (VARCHAR), `before_state` (JSONB), `after_state` (JSONB), `correlation_id` (VARCHAR), `created_at`.

---

## 6. Critical Concurrency & Idempotency Design
1. **Idempotency Flow**:
   - Client sends header `Idempotency-Key: <uuid>`.
   - Handler begins transaction: queries `idempotency_keys` with `FOR UPDATE` or attempts insert.
   - If key exists with same hash and `status = 'RESOLVED'`, immediately returns cached status code and cached response body without stock re-deduction.
   - If key exists with different request hash, throws `409 Conflict`.
   - If in-flight concurrent request with same key is detected, returns `409 Conflict` (or `425 Too Early`).
2. **Atomic Inventory Deduction**:
   - Stock deduction executes inside an ACID database transaction:
     ```sql
     UPDATE products
     SET stock = stock - $1, updated_at = NOW()
     WHERE id = $2 AND stock >= $1 AND is_active = TRUE
     RETURNING *;
     ```
   - If the returned row count is 0, the transaction rolls back with `400 Bad Request` ("Insufficient stock or product inactive").
   - Simultaneous checkouts cannot oversell inventory, guaranteed by Postgres row-level locks and `stock >= 0` check constraints.

---

## 7. Infrastructure Architecture & Docker Setup
- **Multi-stage Dockerfiles**:
  - API: Base node Alpine, builder compiles TypeScript, production runner runs as non-root `node` user with only production dependencies (`npm ci --omit=dev`).
  - Web: Node builder compiles static bundle, Nginx Alpine serves static files and proxies `/api/` upstream.
- **Docker Compose Networking**:
  - Network `internal_net`: Isolated private bridge network connecting Nginx, API, and PostgreSQL.
  - Only Nginx exposes ports `80` (redirect) and `443` (TLS) publicly to the host.
  - PostgreSQL port `5432` and API port `4000` are NOT published to the host machine interface, eliminating public database attack surfaces.
- **Health Checks**:
  - PostgreSQL container includes `pg_isready -U postgres` health check.
  - API container uses `depends_on: { postgres: { condition: service_healthy } }` and implements continuous health probes against `/api/v1/health/live` and `/api/v1/health/ready`.

---

## 8. CI/CD Pipeline Design (GitHub Actions)
1. **Continuous Integration (`.github/workflows/ci.yml`)**:
   - Triggers on PR and push to `main`.
   - Steps:
     - Checkout repository.
     - Node setup & cache.
     - Install dependencies (`npm ci`).
     - TypeScript type-check (`tsc --noEmit`).
     - Linter check.
     - Unit & integration tests execution (idempotency, inventory concurrency, admin audit).
     - ShellCheck validation on bash scripts.
     - Docker image build verification.
2. **Continuous Delivery & Release (`.github/workflows/release.yml`)**:
   - Triggers on release tags (`v*.*.*`) or merged PRs to `main`.
   - Builds production images tagged with commit SHA (`ghcr.io/<owner>/algions-api:${{ github.sha }}`) and semantic version.
   - Pushes to GitHub Container Registry (GHCR).
   - Generates image digest and records release metadata.
3. **Deployment Workflow (`.github/workflows/deploy.yml`)**:
   - Manual workflow dispatch with version/tag input.
   - SSH/deployment runner updates target host, runs database migrations, verifies readiness via `/api/v1/health/ready`, and triggers rollback if verification fails.

---

## 9. Security Strategy
- Zero credentials in repository source code; strictly enforced by `.gitignore` and startup environment validation.
- Centralized configuration schema powered by Zod (`apps/api/src/config/index.ts`) that crashes fast with clear diagnostics if required secrets are absent.
- Admin authentication with bcrypt (salt rounds 10+) and cryptographically signed JWTs with expiration.
- Auditable trail: every inventory adjustment or product update writes immutable record to `audit_events`.
- Principle of Least Privilege: Container runs non-root, Docker drops default Linux capabilities where appropriate (`cap_drop: ALL`), read-only root filesystems where compatible.
- Security HTTP headers in Nginx: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Strict-Transport-Security`.

---

## 10. Logging and Monitoring Strategy
- **Structured JSON Logger**: Pino. Every log entry contains `timestamp`, `level`, `reqId` (UUID correlation ID), `method`, `path`, `status`, and `durationMs`.
- **Sensitive Data Redaction**: Automatic redaction of headers `authorization`, `cookie`, `idempotency-key`, and request body fields `password`, `token`, `secret`.
- **Health & Readiness Endpoints**:
  - `/api/v1/health/live`: Fast ping confirming the Node process event loop is active (HTTP 200).
  - `/api/v1/health/ready`: Performs live database query (`SELECT 1`). Returns HTTP 200 with database status, or HTTP 503 Service Unavailable when the database is unreachable.
- **Metrics Endpoint**: `/api/v1/metrics` exposing Prometheus-compatible metrics: process uptime, request count, error count, and order creation counters.

---

## 11. Backup and Recovery Strategy
- `scripts/backup-db.sh`:
  - Executes `pg_dump` with custom compressed archive format (`-Fc`).
  - Emits timestamped filename (`db_backup_YYYYMMDD_HHMMSS.dump`).
  - Verifies file size > 0 and calculates SHA-256 checksum stored in `.sha256`.
  - Exits non-zero on any failure (`set -Eeuo pipefail`).
- `scripts/restore-db.sh`:
  - Verifies backup file existence and validates SHA-256 integrity.
  - Requires explicit confirmation flag (`--confirm`) to prevent accidental destruction.
  - Restores using `pg_restore --clean --if-exists`.
  - Performs post-restore validation query checking product and order counts.

---

## 12. Deployment Rollback Strategy
- `scripts/rollback.sh`:
  - Reads previous known-good image tag from `.deployment_history` or user parameter.
  - Updates environment image tag and runs `docker compose up -d --no-deps api`.
  - Polls `/api/v1/health/ready` until healthy. If unhealthy within timeout, alerts operator.
  - Database schema migrations are strictly written with backward compatibility (expand-and-contract phase).

---

## 13. Test Strategy & Acceptance Matrix
- **Unit Tests**:
  - Request validators (Zod schemas for orders, products, auth).
  - Price calculation & snapshot formatting.
- **Integration Tests**:
  - Catalog retrieval, category filtering, search.
  - Order creation with valid stock.
  - Insufficient stock rejection.
  - Idempotency: exact replay returns cached response; key collision with different body returns HTTP 409.
  - Concurrency: multiple simultaneous requests racing for single remaining stock unit; exactly one succeeds and stock reaches zero without going negative.
  - Security: Admin endpoints reject unauthenticated or tampered JWT requests; valid admin action produces audit row.
  - Health/Readiness: Readiness returns 503 when database connection is severed.

---

## 14. 15-Day Implementation Milestones
- **Day 1**: Discovery, Superdesign draft retrieval, architecture specification, implementation plan.
- **Days 2–4**: Backend API, database schema, atomic order checkout, idempotency handler, admin auth, audit logging, Dockerfiles.
- **Days 5–8**: Nginx reverse proxy, self-signed TLS, frontend luxury UI implementation, end-to-end integration, GitHub Actions CI/CD.
- **Days 9–11**: Operational automation scripts (`setup.sh`, `deploy.sh`, `rollback.sh`, `backup-db.sh`, `restore-db.sh`, `health-check.sh`), structured logging, metrics.
- **Days 12–13**: Concurrency testing, failure injection & recovery verification, backup/restore proof.
- **Day 14**: Documentation suite (`ARCHITECTURE.md`, `OPERATIONS_RUNBOOK.md`, `API.md`, `SECURITY.md`, `WALKTHROUGH.md`, `DEMO_SCRIPT.md`).
- **Day 15**: Clean repository verification, submission readiness checklist, zero-secret audit.
