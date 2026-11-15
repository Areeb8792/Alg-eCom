# HEAVYWEIGHT // SEASON 04 — Technology Stack Quick Reference

**Repository:** `https://github.com/Areeb8792/Alg-eCom` &nbsp;|&nbsp; **Release Baseline:** `v1.0.4` &nbsp;|&nbsp; **Branch:** `main`

---

## 1. Quick Technology Matrix

| Layer | Core Technologies | Primary Versions | Key Repository Paths |
| :--- | :--- | :--- | :--- |
| **Frontend** | React, React Router, Vite, Tailwind CSS, Lucide | React 18.3, Vite 6.0, Tailwind 3.4 | [`apps/web/src/`](file:///d:/My%20personal/algions/apps/web/src) |
| **Backend** | Node.js, Express, TypeScript, Zod, Pino | Express 4.21, TS 5.7, Zod 3.24 | [`apps/api/src/`](file:///d:/My%20personal/algions/apps/api/src) |
| **Database** | PostgreSQL, `pg` pool, Least-Privilege Roles | PostgreSQL 16 Alpine, pg 8.13 | [`apps/api/src/database/`](file:///d:/My%20personal/algions/apps/api/src/database) |
| **Security** | JWT, bcryptjs, HTTP-only Cookie, Gitleaks | JWT 9.0, bcryptjs 2.4 | [`apps/api/src/middleware/`](file:///d:/My%20personal/algions/apps/api/src/middleware) |
| **DevOps** | Docker, Docker Compose, Nginx, GHCR | Nginx 1.27-alpine, GHCR v1.0.4 | [`docker-compose.yml`](file:///d:/My%20personal/algions/docker-compose.yml), [`infra/nginx/`](file:///d:/My%20personal/algions/infra/nginx) |
| **Monitoring**| Prometheus, Grafana | Prometheus 3.13, Grafana 13.3 | [`infra/prometheus/`](file:///d:/My%20personal/algions/infra/prometheus), [`infra/grafana/`](file:///d:/My%20personal/algions/infra/grafana) |
| **IaC** | Terraform (AWS), Ansible (Host Hardening) | Terraform 1.10+, AWS Provider 5.100 | [`infra/terraform/`](file:///d:/My%20personal/algions/infra/terraform), [`infra/ansible/`](file:///d:/My%20personal/algions/infra/ansible) |
| **Testing** | Vitest (100 tests), Playwright (8 E2E scenarios) | Vitest 3.0, Playwright 1.65 | [`apps/api/tests/`](file:///d:/My%20personal/algions/apps/api/tests), [`e2e/`](file:///d:/My%20personal/algions/e2e) |

---

## 2. Ports and Network Topology

| Service | Internal Port | Host / External Binding | Access URL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Nginx HTTPS** | 443 | `0.0.0.0:443` | `https://localhost/` | Production Storefront (TLS) |
| **Nginx HTTP** | 80 | `0.0.0.0:80` | `http://localhost/` | Auto-redirects to HTTPS |
| **Vite Dev Server** | 3000 | `0.0.0.0:3000` | `http://localhost:3000/` | Local Dev Hot-Reload Storefront |
| **Express API** | 4000 | `127.0.0.1:4000` / Internal | `http://localhost:4000/api/v1` | REST API Gateway |
| **PostgreSQL 16** | 5432 | Internal only (`internal_network`) | `postgres:5432` | Relational Database Engine |
| **Prometheus** | 9090 | Internal (`internal_network`) | `http://prometheus:9090` | Time-Series Metrics Scraper |
| **Grafana** | 3000 | `127.0.0.1:3001` (Loopback only) | `http://127.0.0.1:3001` | Operational Telemetry Dashboards |

---

## 3. Essential Operational Commands

```bash
# 1. Install all monorepo dependencies with strict lockfile
npm ci

# 2. Start local hot-reloading development servers
npm run dev:web    # Frontend on http://localhost:3000
npm run dev:api    # Backend on http://localhost:4000

# 3. Database migrations & catalog seed
npm run db:migrate --workspace=@algions/api
npm run db:seed --workspace=@algions/api

# 4. Run automated test suites & linters
npm run typecheck       # TypeScript compilation check across all packages
npm run lint            # ESLint static analysis
npm test                # 12 Vitest suites (100 passing tests)
npx playwright test     # 8 End-to-end browser user journey scenarios

# 5. Production Docker Compose operations
docker compose up -d    # Start 5-container production stack
docker compose ps       # Inspect container health states
docker compose logs -f  # Tail aggregated container logs
docker compose down     # Stop containers and teardown networks
```

---

## 4. Architectural Highlights

- **Brutalist Design System**: Concrete `#E3E2DE`, Ink `#1B0E0D`, Burnt Red `#C72A09`, Neon Green `#31EF07`, Anton display typography, responsive at 1440px, 963px, 768px, 390px.
- **Pessimistic Inventory Locking**: `SELECT FOR UPDATE` prevents race conditions during high-volume drops.
- **Least-Privilege Roles**: `algions_admin` (DDL), `algions_app` (DML only, no DDL), `algions_backup` (SELECT only).
- **Audit Immutability**: Append-only `audit_events` table enforced by database trigger rejecting updates and deletions.
- **Session Security**: 15-minute JWT access tokens + HTTP-only cookies with cryptographic refresh token rotation and automatic anti-replay breach revocation.
- **Infrastructure as Code**: Terraform AWS EC2/SSM/S3 configurations and Ansible Linux hardening playbooks codified and validated.
