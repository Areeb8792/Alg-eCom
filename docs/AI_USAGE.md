# Algions Platform — AI Attribution, External Assets & Dependencies

## 1. AI Assistance Disclosure
In accordance with Algions AI Labs assessment guidelines and academic integrity standards, this implementation was engineered with the assistance of an advanced AI coding assistant (**Antigravity / Gemini 3.8 Flash**).

### Scope of AI Contribution:
1. **Scaffolding & Architecture**: Structuring the monorepo workspace, generating boilerplate configuration for TypeScript, Tailwind, Docker, and Nginx.
2. **API & Database Implementation**: Authoring Express routing, Zod validation schemas, SQL schema migrations, and transactional idempotency logic.
3. **Frontend Integration**: Translating the supplied Superdesign HTML/CSS draft into modular React components while preserving 100% design fidelity.
4. **DevOps & Scripting**: Writing multi-stage Dockerfiles, Docker Compose orchestrations, bash automation scripts, and GitHub Actions workflows.
5. **Gap Closure & Monorepo Debugging**: Diagnosing npm workspace build-context boundary failures (`npm ERR! code EUSAGE`), refactoring Docker build contexts to repository root, authoring native PostgreSQL backup/restore drills with SHA-256 validation, and authoring container rollback drills.
6. **Documentation & Compliance**: Structuring the comprehensive documentation suite, 32-gate acceptance matrix, operations runbooks, and test plans.

All code, schemas, and configurations were verified for correctness, type integrity, security boundaries, and test execution.

---

## 2. Explicit Operational Constraints & Known Limitations

To maintain absolute non-fabrication integrity, the following operational boundaries are transparently acknowledged:

1. **Remote GHCR Image Publication (Gate 21)**:
   - The GitHub Actions release workflow (`.github/workflows/release.yml`) is fully operational on repository `https://github.com/Areeb8792/Alg-eCom`.
   - Multi-architecture container images (`api` and `web`) with SLSA provenance and SPDX SBOM attestations have been published to `ghcr.io/areeb8792/alg-ecom/` for releases `v1.0.0` and `v1.0.1`, and verified via live `docker pull`.
2. **Local Self-Signed TLS Certificates**:
   - The local Nginx container terminates TLS using a locally generated 2048-bit RSA self-signed certificate (`infra/nginx/ssl/server.crt`). Browsers and CLI tools require explicit acceptance of the self-signed certificate (e.g. `curl -k` or browser security exception). In cloud deployment, this is replaced by an automated Let's Encrypt Certbot ACME container or AWS Certificate Manager (ACM) ALB certificate.
3. **Ansible Provisioning Scope & Target**:
   - The Ansible provisioning playbook (`infra/ansible/playbook.yml`) executes 6 specific tasks: installing prerequisite packages (`curl`, `git`, `openssl`, `ca-certificates`), creating the dedicated unprivileged `algions` service group and user (added to `docker` group), creating `/opt/algions` directories with ownership, applying strict `chmod 0600` permissions on `.env`, and ensuring the Docker systemd service is started and enabled.
   - It assumes Docker Engine is installed on the host and does not execute Docker apt-repository installation from scratch. It was executed and verified 100% idempotent (`changed=0`) against an Ubuntu WSL2 environment rather than a live paid AWS EC2 instance.
4. **Terraform AWS Cloud Infrastructure**:
   - Terraform definitions in `infra/terraform/` (VPC, public subnets, EC2 instance with IAM instance profile for SSM Session Manager, S3 encrypted backup bucket, and native S3 state locking) are verified via `terraform fmt -check` and `terraform validate`. They are deliberately not applied (`terraform apply`) to live AWS to prevent incurring ongoing cloud hosting expenses during the assessment evaluation.
5. **Container Rollback Downtime Characterization**:
   - The rollback procedure (`scripts/rollback.sh`) is characterized accurately as a **health-gated deployment with verified automated rollback** rather than uninterrupted continuous zero downtime. While Nginx dependency gates prevent routing traffic to a degraded candidate container, service recovery during an active candidate crash takes ~15 seconds while the previous container image is restored and passes health checks.

---

## 2. External Libraries & Third-Party Dependencies

### Backend Tier (`apps/api`):
- `express`: Fast, minimalist web framework.
- `pg`: Non-blocking PostgreSQL client and connection pooling.
- `zod`: TypeScript-first schema validation.
- `pino` & `pino-http`: High-performance structured JSON logger with field redaction.
- `jsonwebtoken`: Cryptographic JWT signing and verification.
- `bcryptjs`: Password hashing with salt.
- `uuid`: RFC4122 UUID generation.
- `vitest` & `supertest`: Unit and HTTP integration testing.

### Frontend Tier (`apps/web`):
- `react` & `react-dom`: Component tree rendering.
- `vite`: Build tooling and HMR dev server.
- `tailwindcss`: Utility-first CSS framework.
- `lucide-react`: Lightweight, accessible SVG icons.

### Infrastructure & Reverse Proxy:
- `nginx:alpine`: Lightweight reverse proxy and static asset delivery.
- `postgres:16-alpine`: Relational database container.

---

## 3. Visual Assets & Fonts Attribution
- **Fonts**:
  - `Anton` by Vernon Adams (Google Fonts, Open Font License).
  - `Space Grotesk` by Florian Karsten (Google Fonts, Open Font License).
- **Images**:
  - Luxury editorial fashion photography sourced from **Unsplash** (per the Superdesign draft reference).
- **Textures**:
  - Embedded SVG fractal noise grain filter overlay.
