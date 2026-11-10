# Algions AI Labs — DevOps Implementation Plan & Toolchain Rationale

**Project**: HEAVYWEIGHT Luxury Fashion E-Commerce  
**Service**: Product & Order API | DevOps & Cloud Engineering Assessment  
**Assignment**: Cloud Deployment & CI/CD – E-Commerce Platform  
**Company**: ALGIONS AI LABS PRIVATE LIMITED  
**Document**: `docs/DEVOPS_IMPLEMENTATION_PLAN.md`

---

## 1. Primary DevOps Toolchain Rationale

The assessment requires building a small, domain-specific Product and Order service that is reproducibly buildable, deployable, observable, and recoverable using production-style engineering practices.

To achieve maximum reliability without accidental complexity, we select one cohesive, industry-standard toolchain:

| Capability | Selected Tool | Engineering Rationale | Deliberately Avoided Alternative & Reason |
| :--- | :--- | :--- | :--- |
| **Source Control** | Git & GitHub | Universal standard, branch protection, pull requests, semantic release tags. | Subversion / Mercurial. |
| **CI Automation** | GitHub Actions | Native runner integration, secret masking, OIDC AWS authentication, matrix builds. | Jenkins (requires separate server maintenance, plugin security overhead). |
| **Container Engine** | Docker & Compose | Multi-stage builds, non-root execution, single-node orchestration with internal network isolation. | Kubernetes (excessive operational overhead for a small domain service). |
| **Image Registry** | GitHub Container Registry (GHCR) | Private, token-authenticated, immutable commit SHA and semver image tags, zero external hosting cost. | Self-hosted Harbor (unnecessary infrastructure footprint). |
| **Operating System** | Linux Ubuntu LTS / Amazon Linux 2023 | Stability, modern kernel, official cloud image support, security patch cadence. | Legacy enterprise distributions with slow package ecosystems. |
| **Reverse Proxy** | Nginx Alpine | Low memory footprint, battle-tested TLS termination, security headers, static SPA delivery. | Apache HTTPD (heavier memory footprint, process-based threading). |
| **Database** | PostgreSQL 16 | ACID transactions, row-level stock locking (`WHERE stock >= requested`), JSONB, atomic idempotency. | MongoDB / MySQL (weaker row locking semantics for financial transactions). |
| **Cloud Compute** | AWS EC2 (t3.small/medium) | Predictable performance, IAM integration, Systems Manager Session Manager (no open port 22). | Unmanaged bare-metal or complex multi-node clusters. |
| **Host Access** | AWS SSM Session Manager | Browser and CLI shell access over encrypted AWS backbone; zero public SSH ports open to the internet. | Public SSH on port 22 (vulnerable to brute-force and port scanning). |
| **Infrastructure as Code** | Terraform (HashiCorp) | Declarative state, reproducible AWS provisioning, dependency graphing, drift detection. | CloudFormation (vendor lock-in) or manual AWS console clicks. |
| **Configuration Mgmt** | Ansible | Agentless SSH/SSM execution, idempotent tasks, strict file permissions (`chmod 0600 .env`). | Chef / Puppet (requires daemon installation and management servers). |
| **Metrics Collection** | Prometheus | Pull-based scrape model, standardized text format, low resource overhead. | Datadog / New Relic (costly SaaS dependencies for an assessment). |
| **Visualization** | Grafana | Pre-provisioned dashboards, unified panels for API uptime, latency, DB connectivity, and orders. | Static charts or custom ad-hoc scripts. |
| **Vulnerability Scan** | Trivy (Aqua Security) | Fast container image scanning, CVE detection in OS packages and npm lockfiles. | Heavy manual audits. |
| **Secret Detection** | Gitleaks | Automated pre-commit and CI scanning preventing committed credentials and private keys. | Manual code review alone. |

---

## 2. Phased Implementation Roadmap

### Phase 1: Containerization & Security Hardening
- Multi-stage Dockerfiles (`apps/api/Dockerfile`, `apps/web/Dockerfile`).
- Non-root user execution (`node` UID 1000, `nginx` UID 101).
- Minimal runtime base images (`node:22-alpine`, `nginx:alpine`, `postgres:16-alpine`).
- Docker Compose configuration with internal bridge network, volume persistence, capability dropping (`cap_drop: ALL`), and explicit CPU/memory limits.
- Public port 5432 strictly omitted.

### Phase 2: Automated Quality Pipeline (CI)
- `.github/workflows/ci.yml`:
  1. Source checkout (`fetch-depth: 0` for Gitleaks).
  2. Setup Node.js 22 LTS with npm cache.
  3. `npm ci` using lockfile.
  4. Gitleaks secret scanning with `.gitleaks.toml`.
  5. Monorepo TypeScript typecheck (`npm run typecheck`).
  6. ESLint static analysis (`npm run lint`).
  7. Vitest unit and integration test suite (`npm test`).
  8. Playwright Chromium browser installation.
  9. Background development servers startup.
  10. Playwright end-to-end browser test execution (`npm run test:e2e`).
  11. Multi-stage Docker image builds.
  12. Trivy vulnerability scans on API and Web container images.

### Phase 3: Container Release & Versioning (CD)
- `.github/workflows/release.yml`:
  - Triggers on semantic tag push (`v*.*.*`).
  - Authenticates to `ghcr.io` via GitHub token.
  - Builds and pushes images with immutable commit SHA and semver tags.
  - Records image digests in workflow summaries.

### Phase 4: Production Nginx Proxy & TLS Hardening
- Nginx configuration (`infra/nginx/nginx.conf`, `infra/nginx/default.conf`).
- Mandatory HTTP port 80 to HTTPS port 443 301 redirection.
- Modern TLS 1.3/1.2 ciphers.
- Security headers: CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff.
- SPA static delivery with `try_files $uri $uri/ /index.html` fallback.
- API reverse proxying to `api:4000` with `$request_id` correlation header and buffering disabled.
- Automated self-signed certificate generation (`infra/nginx/generate-certs.sh`).

### Phase 5: Linux Host Automation & Operational Tooling
- 7 core bash operational scripts in `scripts/`:
  - `setup.sh`: Automated host environment and container startup.
  - `deploy.sh`: Versioned deployment with health polling and automatic rollback fallback.
  - `rollback.sh`: Emergency rollback to previous known-good tag from `.deployment_history`.
  - `health-check.sh`: Probes `/api/v1/health/live` and `/api/v1/health/ready`.
  - `smoke-test.sh`: 8 automated end-to-end curl assertions.
  - `backup-db.sh`: Compressed `pg_dump -Fc` with SHA-256 checksum and 7-day retention cleanup.
  - `restore-db.sh`: Safe restore requiring `--confirm`, verifying SHA-256 integrity.

### Phase 6: Cloud Infrastructure (Terraform & Ansible)
- `infra/terraform/`: AWS EC2 instance, IAM SSM Session Manager role, default VPC, security group limiting ingress strictly to HTTP(80) and HTTPS(443), encrypted gp3 EBS root volume, and encrypted S3 bucket for off-site backups with 30-day lifecycle expiration.
- `infra/ansible/playbook.yml`: Idempotent host configuration: prerequisite packages, dedicated `algions` service user, `/opt/algions` directories, `chmod 0600` on `.env`, Docker systemd service enablement.

### Phase 7: Full-Stack Observability
- Pino structured JSON logging with correlation IDs and sensitive field redaction.
- Application Prometheus metrics collector (`apps/api/src/metrics/prometheus.ts`) exposing `/api/v1/metrics`.
- Prometheus scrape configuration (`infra/prometheus/prometheus.yml`).
- Grafana dashboard provisioning (`infra/grafana/dashboards/algions_overview.json`) displaying API availability, request rate, latency, database health, and domain orders.

### Phase 8: Verification & Evidence
- Capture genuine Playwright browser screenshots (`01` through `08` in `docs/evidence/`).
- Document all 32 assessment gates in `docs/FINAL_ACCEPTANCE_MATRIX.md`.
- Compile final verification summary in `docs/FINAL_DEVOPS_VERIFICATION.md`.
