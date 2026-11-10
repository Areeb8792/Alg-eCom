# Algions AI Labs — Cloud Deployment & CI/CD E-Commerce Platform
### DevOps & Cloud Engineering Shortlisting Assessment

[![CI Pipeline](https://github.com/sayyeds/algions-ecommerce-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/sayyeds/algions-ecommerce-platform/actions/workflows/ci.yml)
[![Tests Passing](https://img.shields.io/badge/backend%20tests-25%20passed-brightgreen.svg)](docs/TEST_PLAN.md)
[![E2E Tests](https://img.shields.io/badge/playwright%20e2e-8%20passed-brightgreen.svg)](docs/TEST_PLAN.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-5--Service%20Stack-2496ED.svg)](https://www.docker.com/)
[![Nginx](https://img.shields.io/badge/Nginx-1.30.6--alpine-009639.svg)](https://nginx.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16--alpine-336791.svg)](https://www.postgresql.org/)
[![Prometheus](https://img.shields.io/badge/Prometheus-3.13.5%20LTS-E6522C.svg)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Grafana-13.3.0-F46800.svg)](https://grafana.com/)

---

## 1. Project Overview

This repository contains the production-engineered **Product and Order Service** for **Algions AI Labs Private Limited**, satisfying all requirements of the DevOps & Cloud Engineering assessment.

Rather than implementing a generic mock marketplace, this platform delivers an observable, recoverable, and containerized domain service coupled with an editorial luxury-fashion interface adhering to the exact selected Superdesign draft (**HEAVYWEIGHT - Luxury Fashion E-commerce**, Project `7f696042-42df-4c14-a518-cf97a2601743`, Draft `df189593-ef46-4348-841e-a68cf7d4f972`).

### Core Engineering Capabilities Demonstrated:
- **ACID-Backed Idempotency**: Order creation requires an `Idempotency-Key` header with SHA-256 payload verification. Repeating a request returns the cached result without duplicate stock deduction. Altering the payload with the same key returns `HTTP 409 Conflict`.
- **Atomic Concurrency & Financial Safety**: Eliminates overselling via PostgreSQL atomic updates (`UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING *;`). Monetary amounts are tracked strictly in integer minor units (cents), preventing floating-point rounding vulnerabilities.
- **Defense-in-Depth Containerization**: Multi-stage Docker builds running as unprivileged `node` user (UID 1000) with dropped Linux capabilities (`cap_drop: ALL`). PostgreSQL is strictly isolated to an internal Docker bridge network and never exposed on the public host interface.
- **Nginx Reverse Proxy & TLS**: Enforces HTTPS (TLS 1.2/1.3), redirects HTTP traffic from port 80 to 443 with 301 Moved Permanently, applies strict security headers (CSP, HSTS, X-Frame-Options DENY), and serves the React SPA.
- **Observability & Diagnostics**: Deep health probes (`/api/v1/health/live`, `/api/v1/health/ready`), Prometheus-compatible `/metrics` with latency histograms, Grafana 13.3.0 dashboard bound strictly to localhost (`127.0.0.1:3001`), structured JSON logging (Pino) with sensitive credential redaction, and request correlation IDs (`X-Correlation-ID`).
- **Disaster Recovery**: Automated database backup script (`pg_dump -Fc` with SHA-256 checksum generation and 7-day retention) and verified restore script with integrity checks and safety confirmation guards. 100% verified across 7 domain entities.
- **Health-Gated Automated Rollback**: Deployment automation (`scripts/deploy.sh`) verifies health after container release and automatically triggers rollback (`scripts/rollback.sh`) to the previous known-good version if readiness fails.
- **Infrastructure as Code & Automation**: Production-ready Terraform AWS EC2 infrastructure with Systems Manager Session Manager access (no open SSH port 22 to the internet) and Ansible provisioning playbook verified 100% idempotent on Linux.

---

## 2. Architecture & Network Topology

```text
[ Client Web Browser / Storefront ]         [ Platform Operator / SRE ]
                 │                                        │
                 ▼ HTTPS :443 / HTTP :80 (301)            ▼ HTTP :3001 (Localhost Only)
┌──────────────────────────────────────────────────┐ ┌──────────────────────────────────────┐
│ Nginx Reverse Proxy (algions-nginx)              │ │ Grafana 13.3.0 (algions-grafana)     │
│ - Static React SPA Delivery (Gzip compressed)    │ │ - Pre-provisioned Dashboards         │
│ - Security Headers: CSP, HSTS, X-Frame-Options   │ │ - Bound strictly to 127.0.0.1:3001   │
└────────────────────────┬─────────────────────────┘ └──────────────────┬───────────────────┘
                         │ Private Docker Bridge                        │ Internal Bridge
                         ▼ Forward /api/v1/*                            ▼ PromQL Queries :9090
┌──────────────────────────────────────────────────┐ ┌──────────────────────────────────────┐
│ Product & Order API Service (algions-api :4000)  │ │ Prometheus 3.13.5 LTS (algions-prom) │
│ - Node.js LTS 24.22.2 / TypeScript / Express     │ │ - Scrapes /api/v1/metrics            │
│ - Unprivileged 'node' User (UID 1000) | cap_drop │ │ - Latency Histograms & Counters      │
└────────────────────────┬─────────────────────────┘ └──────────────────┬───────────────────┘
                         │ Private Docker Bridge (Port 5432)            │
                         ▼ [NO HOST PORT EXPOSURE]                      │
┌──────────────────────────────────────────────────┐                    │
│ Relational Database (algions-postgres :5432)     │                    │
│ - PostgreSQL 16 Alpine                           │                    │
│ - Persistent Named Volume: algions-postgres-data │────────────────────┘
│ - Atomic Row-Level Locking, Check Constraints    │
└──────────────────────────────────────────────────┘
```

For complete architectural specifications and diagrams, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 3. Technology Stack & Key Choices

| Tier | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend API** | Node.js 24.22.2 LTS, TypeScript, Express | High-throughput async I/O, type-safe API contracts, fast boot time. |
| **Persistence** | PostgreSQL 16 Alpine, `pg` Connection Pool | Native row-level locking, ACID transactions, check constraints, foreign keys. |
| **Logging** | Pino & Pino-HTTP | Structured JSON logs, sub-millisecond execution, automatic secret redaction. |
| **Validation** | Zod | Runtime input parsing and type inference for query parameters and JSON bodies. |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide | High-fidelity editorial luxury-fashion UI matching Superdesign draft `df189593`. |
| **Proxy / Web** | Nginx 1.30.6 Alpine | Low-memory TLS termination, HTTP-to-HTTPS redirect, static asset caching. |
| **Containers** | Docker (Multi-stage), Docker Compose | Minimal attack surface, dependency locking, non-root execution. |
| **Observability**| Prometheus 3.13.5 LTS, Grafana 13.3.0 | Real-time p95 request latency histograms, error rates, local-only dashboard. |
| **CI/CD** | GitHub Actions, GHCR | Automated linting, typechecking, 25 backend tests, 8 Playwright E2E, Trivy, Gitleaks. |
| **IaC / Cloud**| Terraform, AWS EC2, SSM, Ansible | Parameterized cloud infrastructure with secure Session Manager access. |
| **Containers** | Docker (Multi-stage), Docker Compose | Minimal attack surface, dependency locking, non-root execution. |
| **CI/CD** | GitHub Actions, GHCR | Automated linting, typechecking, 20 automated tests, and container publishing. |
| **IaC / Cloud**| Terraform, AWS EC2, SSM, Ansible | Parameterized cloud infrastructure with secure Session Manager access. |

---

## 4. Quick Start & Local Setup

### 4.1 Prerequisites
- **Node.js**: `v20` or `v22` LTS
- **npm**: `v10` or `v11`
- **Docker & Docker Compose**: (v24+ / Compose v2+)
- **OpenSSL**: (for local self-signed TLS certificate generation)

### 4.2 Clone & Install
```bash
git clone https://github.com/sayyeds/algions-ecommerce-platform.git
cd algions-ecommerce-platform

# Install monorepo dependencies
npm install
```

### 4.3 Automated Environment Setup (One Command)
Run the automated initialization script:
```bash
bash scripts/setup.sh
```
This script automatically:
1. Validates host dependencies (`docker`, `openssl`).
2. Creates `.env` from `.env.example` if absent.
3. Generates a local 2048-bit RSA self-signed TLS certificate for Nginx HTTPS.
4. Builds multi-stage production container images.
5. Launches containers in background mode.
6. Waits for PostgreSQL readiness and executes database schema migrations and seed.

### 4.4 Verified Production Endpoints
Once the 5-service production container stack is running:
- **Web Storefront**: `https://localhost/` (or `http://localhost/` for automatic 301 redirect)
- **API Liveness Probe**: `https://localhost/api/v1/health/live`
- **API Readiness Probe**: `https://localhost/api/v1/health/ready`
- **Application Prometheus Metrics**: `https://localhost/api/v1/metrics`
- **Grafana Observability Dashboard**: `http://127.0.0.1:3001` (Bound strictly to localhost loopback)
- **Prometheus Scrape Inspection**: `docker compose exec prometheus wget -qO- http://localhost:9090/api/v1/targets` (Internal container network)

---

## 5. Running the Application Locally (Development Mode)

If you prefer running without Docker directly on your host:
```bash
# Terminal 1: Run PostgreSQL (via Docker or local service)
docker run -d --name local-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=algions_db -p 5432:5432 postgres:16-alpine

# Terminal 2: Run Database Migrations & Seed
npm run db:migrate --workspace=@algions/api
npm run db:seed --workspace=@algions/api

# Terminal 3: Start API in watch mode (Port 4000)
npm run dev:api

# Terminal 4: Start Web Frontend with HMR (Port 3000)
npm run dev:web
```
Open your browser to:
- **Web Storefront**: `http://localhost:3000` (or `https://localhost` via Nginx)
- **API Liveness Probe**: `http://localhost:4000/api/v1/health/live`
- **API Readiness Probe**: `http://localhost:4000/api/v1/health/ready`
- **Prometheus Metrics**: `http://localhost:4000/api/v1/metrics`

---

## 6. Testing & Quality Verification

The test suite covers API routing, Zod schema validation, JWT authentication security, server-side price calculation, transactional stock locking, and idempotency guarantees:

```bash
# Run all unit and integration tests across monorepo:
npm test

# Run TypeScript type check across API and Web:
npm run typecheck

# Run static linter:
npm run lint

# Build both production artifacts:
npm run build
```

### Test Suite Execution Output
```text
Test Files  5 passed (5)
     Tests  20 passed (20)
  Duration  1.64s
```
For complete details and test scenario mapping, see [docs/TEST_PLAN.md](docs/TEST_PLAN.md).

---

## 7. Endpoints & API Reference

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health/live` | Public | Liveness probe (HTTP 200). |
| `GET` | `/api/v1/health/ready` | Public | Readiness probe (Deep database probe, HTTP 200 or 503). |
| `GET` | `/api/v1/metrics` | Public | Plaintext Prometheus metrics for scraping. |
| `GET` | `/api/v1/products` | Public | Paginated product catalog with category and search filter. |
| `GET` | `/api/v1/products/:id` | Public | Single product details by UUID. |
| `POST`| `/api/v1/orders` | Public | Transactional checkout with `Idempotency-Key` header. |
| `GET` | `/api/v1/orders/:id` | Public | Order status inspection by reference or UUID. |
| `POST`| `/api/v1/admin/auth/login` | Public | Authenticates admin credentials, issues JWT bearer token. |
| `PATCH`| `/api/v1/admin/products/:id` | **Admin JWT** | Updates product details and logs audit event. |
| `POST`| `/api/v1/admin/products/:id/stock-adjustments` | **Admin JWT** | Adjusts stock (+/-) with reason note and logs audit event. |
| `GET` | `/api/v1/admin/audit-events` | **Admin JWT** | Retrieves immutable audit events stream. |

For full request/response schemas and OpenAPI 3.0 specification, see [docs/API.md](docs/API.md).

---

## 8. Operational Procedures & Shell Scripts

All scripts are idempotent, provide meaningful exit codes, and utilize `set -Eeuo pipefail`.

### 8.1 Database Backup & Recovery
```bash
# Create compressed timestamped backup with SHA-256 checksum:
bash scripts/backup-db.sh
# -> Outputs: backups/db_backup_YYYYMMDD_HHMMSS.dump and .sha256

# Restore database from backup (requires explicit --confirm flag):
bash scripts/restore-db.sh backups/db_backup_YYYYMMDD_HHMMSS.dump --confirm
```

### 8.2 Deployment & Automated Rollback
```bash
# Deploy a new container version:
bash scripts/deploy.sh v1.1.0

# If post-deployment verification fails, deploy.sh automatically triggers:
bash scripts/rollback.sh
```

### 8.3 End-to-End Automated Smoke Test
```bash
# Runs full catalog, auth, stock adjustment, and idempotency assertions:
bash scripts/smoke-test.sh https://localhost
```

For complete diagnostic commands, see [docs/OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md).

---

## 9. Infrastructure as Code (IaC) & Cloud

### 9.1 Terraform AWS Deployment
A minimal, secure AWS EC2 deployment configuration is located in `infra/terraform/`:
- **Security Group**: Restricts ingress to HTTP (80) and HTTPS (443) only.
- **SSM Session Manager**: Port 22 (SSH) is deliberately not exposed. Access is managed via IAM instance profile using AWS Systems Manager.
- **Validation**:
  ```bash
  cd infra/terraform
  terraform init
  terraform fmt -check
  terraform validate
  ```

### 9.2 Ansible Host Configuration
An automated Linux host configuration playbook is provided under `infra/ansible/playbook.yml` to provision prerequisite packages, create dedicated unprivileged service users, configure permissions (`chmod 600` on `.env`), and enable Docker.

---

## 10. Documentation Index

- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) — 15-day milestone plan, architectural design, component hierarchy.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture, network security boundaries, database ERD, sequence diagrams.
- [docs/API.md](docs/API.md) — Endpoint specifications, request/response examples, OpenAPI 3.0 specification.
- [docs/OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md) — Day-2 operational commands, diagnostic playbooks, log inspection.
- [docs/SECURITY.md](docs/SECURITY.md) — Defense-in-depth security model, secret management, logging redaction.
- [docs/BACKUP_RESTORE.md](docs/BACKUP_RESTORE.md) — Database backup/restore procedures, recovery objectives (RPO/RTO), empirical evidence.
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) — Diagnostic decision tree, common failure modes, root-cause remediations.
- [docs/WALKTHROUGH.md](docs/WALKTHROUGH.md) — Technical interview walkthrough, architectural trade-offs, anticipated questions.
- [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) — 3–5 minute live demonstration sequence.
- [docs/TEST_PLAN.md](docs/TEST_PLAN.md) — 22-point test execution matrix with status evidence.
- [docs/AI_USAGE.md](docs/AI_USAGE.md) — Truthful disclosure of AI tools, external libraries, and visual assets attribution.

---

## 11. Known Limitations & Production Roadmap

1. **Self-Signed Certificates in Local Dev**: In a production deployment with a real domain, the self-signed certificates in `infra/nginx/ssl` should be provisioned with Let's Encrypt / Certbot automated renewals via the ACME protocol.
2. **Single Database Node**: For higher availability in enterprise production, PostgreSQL should be backed by an AWS RDS Multi-AZ instance or Patroni cluster with automated read-replicas.
3. **Payment Gateway Integration**: In this assessment, order checkout creates verified orders in integer minor units without processing live credit cards, focusing strictly on backend inventory correctness and idempotency guarantees.

---

## 12. License
This project was developed for the **Algions AI Labs Private Limited** DevOps & Cloud Engineering Shortlisting Assessment.
All rights reserved.
