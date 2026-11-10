# Algions Platform — Security Engineering & Hardening Architecture

## 1. Threat Modeling & Defense-in-Depth Strategy

The application adopts a **defense-in-depth** posture across all layers: network, host, container, application runtime, and database.

```text
[ Internet / External Clients ]
          │
          ▼  HTTPS (TLS 1.2 / 1.3 only, Strict Ciphers, Port 80 Redirects)
[ Nginx Reverse Proxy ] ─── (Security Headers: CSP, HSTS, X-Frame-Options DENY)
          │
          ▼  Docker Bridge Network (Internal only, Port 4000)
[ Express API Tier ] ─── (Non-root 'node', Zod input validation, JWT auth, Pino redaction)
          │
          ▼  Docker Bridge Network (Internal only, Port 5432)
[ PostgreSQL 16 DB ] ─── (Parameterized SQL, Password hash bcrypt, Immutable audit logs)
```

---

## 2. Key Security Controls Implemented

### 2.1 Secret Management & Zero-Credential Policy
- **Startup Validation**: Critical secrets (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD`) are validated at process boot via Zod (`apps/api/src/config/index.ts`). If secrets are missing or malformed, the application aborts immediately with a non-zero exit code.
- **Git Hygiene**: Comprehensive `.gitignore` and `.dockerignore` patterns ensure `.env`, `.pem`, `.key`, and `.dump` files cannot be committed.

### 2.2 Network Isolation & Least Exposure
- **Database Boundary**: Port `5432` is intentionally NOT published to the host machine interface in `docker-compose.yml`. Only containers within the private bridge network `algions-internal-bridge` can reach PostgreSQL.
- **No Direct API Access**: Port `4000` is kept internal; all external client traffic must route through the Nginx reverse proxy.
- **TLS Configuration**: Supports TLS 1.2 and 1.3 with high-strength cipher suites. Plain HTTP requests on port 80 are redirected with `301 Moved Permanently`.

### 2.3 Container Runtime Hardening
- **Non-Root Execution**: The production API Dockerfile executes under the unprivileged `node` user (UID 1000).
- **Capability Dropping**: Docker Compose drops default Linux capabilities:
  ```yaml
  security_opt:
    - no-new-privileges:true
  cap_drop:
    - ALL
  ```
- **Minimal Attack Surface**: Multi-stage Docker builds discard compilers, development headers, and devDependencies, shipping only production artifacts.

### 2.4 Administrative Authentication & Immutable Audit Events
- **Password Hashing**: Passwords stored using bcrypt with 10 salt rounds.
- **Cryptographic Tokens**: Admin sessions utilize cryptographically signed JSON Web Tokens (JWT) with strict expiration (`24h`).
- **Audit Trails**: Every administrative product modification or stock change generates an immutable record in the `audit_events` table containing actor ID, username, action type, resource ID, before/after JSON snapshots, and request correlation ID.

### 2.5 Structured Logging Redaction
Pino structured logging redacts sensitive fields automatically before writing to stdout:
```javascript
paths: [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["idempotency-key"]',
  'body.password',
  'body.token',
  'body.secret'
]
```
Even in debug mode, authorization bearer tokens and raw passwords never appear in application logs or monitoring dashboards.

### 2.6 Financial Data Integrity & Injection Protection
- **No Floating Point Numbers**: Currency is strictly tracked as integer cents (`price_cents`), preventing decimal rounding exploitation.
- **Server Authority**: The backend never accepts prices or subtotals from client payloads. Unit prices are retrieved directly from the database inside row-locked transactions.
- **Parameterized SQL**: All database operations use `$1, $2` parameters via `pg`, eliminating SQL injection vulnerabilities.
