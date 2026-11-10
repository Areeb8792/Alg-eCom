# Algions E-Commerce Platform — Technical Interview Walkthrough & Architecture Rationale

## 1. Executive Summary & Problem Framing
This project implements the **Product and Order API** for **Algions AI Labs**, fulfilling the Cloud Deployment & CI/CD engineering shortlisting assessment.

Rather than implementing a bloated, fragile mock marketplace with dozens of unfinished features, this platform delivers a **laser-focused, production-grade service** with:
1. Strict financial correctness (integer minor units).
2. Atomic inventory locking (preventing overselling under high concurrency).
3. ACID database-backed idempotency (solving duplicate order creation).
4. Containerization and network security (least privilege, non-root, internal database isolation).
5. Automated CI/CD pipelines (typecheck, lint, automated tests, Docker multi-stage builds, GHCR container publishing).
6. Operational recoverability (verified backup, disaster restore, automated rollback).

---

## 2. Technology Selection & Trade-Off Analysis

### 2.1 Backend Runtime: Node.js LTS + TypeScript (vs Python / Go)
- **Selection**: Node.js 22 LTS with strict TypeScript (`strict: true`, `NodeNext`).
- **Why**: Excellent async I/O performance for high-throughput transactional APIs, mature ecosystem for JSON-based web payloads, strong type safety ensuring contracts between API and client.
- **Alternatives Considered**:
  - *Go*: High raw concurrency, but higher development overhead for database migrations and rapid schema prototyping within the assessment window.
  - *Python (FastAPI)*: Good ergonomics, but slower concurrent request throughput on CPU-bound JSON serialization compared to Node V8 JIT.

### 2.2 Persistence: PostgreSQL 16 with Raw `pg` Pool (vs Prisma / TypeORM / MongoDB)
- **Selection**: PostgreSQL 16 with raw parameterized SQL queries via `pg`.
- **Why**:
  - Relational integrity: Foreign keys, `CHECK (stock >= 0)`, and row-level locks (`SELECT ... FOR UPDATE`) are native primitives.
  - Concurrency control: Atomic updates such as `UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING *;` guarantee inventory correctness without race conditions.
- **Why ORMs Were Avoided for Core Transactions**: High-level ORMs (e.g. Prisma) abstract away row locks and transaction isolation levels, frequently causing hidden N+1 queries, race conditions, or inability to write atomic returning updates.

### 2.3 Idempotency Strategy: Relational Table with Request Hash (vs Redis Cache)
- **Selection**: PostgreSQL `idempotency_keys` table with SHA-256 payload hash and row-level lock.
- **Why**: An in-memory cache or Redis instance can lose data on restart or introduce split-brain conditions. In our design, reserving the idempotency key and deducting stock occur inside the **exact same ACID database transaction**. If the transaction commits, both the order and the idempotency state are atomically persisted.
- **Payload Hash Verification**: A client cannot silently reuse an idempotency key with an altered price or quantity; doing so immediately trips the hash comparison and returns `409 Conflict`.

### 2.4 Ingress & Web Delivery: Nginx (vs Caddy / Traefik)
- **Selection**: Nginx Alpine reverse proxy.
- **Why**: Industry standard for enterprise Linux environments. Predictable memory footprint (~10MB), robust SSL/TLS termination, battle-tested HTTP-to-HTTPS redirects, and high-performance static asset delivery with gzip compression.

### 2.5 Architecture Sizing: Focused Service (vs Microservices / Kubernetes)
- **Decision**: Purpose-built domain service orchestrated with Docker Compose and Linux shell automation.
- **Why**: Introducing Kubernetes, Kafka, or a microservices mesh for a small assessment adds operational fragility, slow cold boots, and unnecessary cognitive overhead. A well-engineered single service with clean modular layering demonstrates true senior DevOps ownership.

---

## 3. Key Technical Questions to Confidently Answer During Interview

1. **How does the system prevent overselling when 50 customers checkout the last item simultaneously?**
   > *"We use PostgreSQL row-level locks during atomic stock deduction: `UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING *;`. PostgreSQL locks the target product row. The first transaction deducts stock to 0; subsequent transactions in the race fail the `stock >= $1` condition, return 0 rows, and cleanly rollback with HTTP 400 Insufficient Stock without ever allowing negative inventory."*

2. **How is idempotency implemented and what happens if a request is repeated?**
   > *"When a request arrives with an `Idempotency-Key` header, we hash the request body with SHA-256 and query the `idempotency_keys` table using `FOR UPDATE`. If an entry exists with the same hash and is resolved, we immediately return the cached order and HTTP status with `X-Idempotent-Replayed: true` without deducting stock again. If the hash differs, we return `409 Conflict`."*

3. **Why isn't PostgreSQL exposed on port 5432 on the host machine?**
   > *"To enforce the principle of least privilege and eliminate external attack surfaces. PostgreSQL only listens on the private internal Docker bridge network (`algions-internal-bridge`). Only the API container can connect to it. External traffic must enter via Nginx on ports 80/443."*

4. **How do you verify a database backup before restoring it?**
   > *"Our backup script (`backup-db.sh`) generates a SHA-256 hash alongside the `.dump` file. During restore (`restore-db.sh`), the script verifies the SHA-256 checksum first. It also requires an explicit `--confirm` flag to prevent accidental overwrites, and runs verification count queries post-restore."*

5. **How does your rollback strategy work during a failed deployment?**
   > *"Our deployment script tracks image versions in `.deployment_history`. After deploying a new image, it probes `/api/v1/health/ready` in a 60-second loop. If the endpoint fails, it automatically executes `scripts/rollback.sh`, which pulls the previous known-good image tag from history, restarts the containers, and verifies readiness."*
