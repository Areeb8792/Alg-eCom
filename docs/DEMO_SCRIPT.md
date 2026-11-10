# Algions AI Labs — 3–5 Minute Technical Demonstration Script

This script is structured for a concise, high-impact technical walkthrough during an engineering interview or technical review.

---

## Part 1: Architecture & Design System (Minute 0:00 – 1:00)
- **Action**: Open the browser to `http://localhost:3000` (or `https://localhost` under Docker Nginx).
- **Spoken Points**:
  > *"Here is the HEAVYWEIGHT luxury fashion e-commerce storefront. It follows the exact Superdesign draft `df189593-ef46-4348-841e-a68cf7d4f972` — brutalist editorial typography with Anton display headings, Space Grotesk metadata, grain texture overlay, and real-time inventory synchronization."*
- **Action**: Point out the floating **Health Signal** pill in the lower left corner:
  > *"Notice the real-time DevOps health signal: the API reports LIVE and the database reports READY with sub-millisecond query latency. The API is powered by a Node.js 24 LTS runtime and Express."*

---

## Part 2: Order Creation, Idempotency & Privacy Protection (Minute 1:00 – 2:15)
- **Action**: Click on a product (e.g. `Statement Puffer`), select Quantity 2, click `ADD TO BAG`.
- **Action**: Open Shopping Bag (`/bag`) and proceed to Checkout (`/checkout`).
- **Spoken Points**:
  > *"In the checkout workflow, all monetary calculations are performed strictly on the server in integer cents ($280.00 = 28000 cents), preventing client price tampering. In the lower drawer, technical diagnostics expose the active cryptographic `Idempotency-Key` and SHA-256 request payload hash."*
- **Action**: Click `PLACE ORDER`.
- **Observation**: Order confirms with reference `HW-2026-XXXX`.
- **Action**: Navigate to `/track-order` and search the order reference.
- **Spoken Points**:
  > *"For customer privacy protection, lookups without matching credentials mask sensitive customer PII (`c***@heavyweight.nyc`). Verified requests with customer email matching or admin JWT disclose full order records."*

---

## Part 3: Prometheus Metrics & Latency Histogram (Minute 2:15 – 3:15)
- **Action**: Open terminal or browser to `http://localhost:4000/api/v1/metrics`.
- **Spoken Points**:
  > *"The API features a native Prometheus metric engine. In addition to process uptime and memory, notice the `http_request_duration_seconds` metric: it is a true Prometheus histogram with cumulative buckets from 5 milliseconds to 10 seconds. In Grafana, this powers real-time p95 percentile latency graphs calculated via `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`."*
- **Action**: Point out domain counters:
  > *"Notice `orders_created_total`, `orders_idempotent_replayed_total`, and `stock_adjustments_total`. Every business event increments real-time counters scraped by Prometheus every 10 seconds."*

---

## Part 4: Deliberate Failure, Observability & Recovery (Minute 3:15 – 4:15)
- **Action**: Run the health check script in Git Bash:
  ```bash
  bash scripts/health-check.sh http://localhost:4000
  ```
- **Spoken Points**:
  > *"The platform decouples liveness from readiness. If PostgreSQL is disconnected or stopped in the test environment, `/api/v1/health/live` remains 200 OK because the Node.js process is healthy, but `/api/v1/health/ready` immediately returns HTTP 503 Service Unavailable, alerting ingress controllers and Grafana to stop routing traffic."*
- **Action**: Demonstrate PostgreSQL reconnection:
  > *"As soon as PostgreSQL recovers, the readiness probe automatically restores to HTTP 200, orders resume processing, and the database status gauge returns to HEALTHY."*

---

## Part 5: Backup, Restoration & Rollback (Minute 4:15 – 5:00)
- **Action**: Run the database backup routine:
  ```bash
  bash scripts/backup-db.sh
  ```
- **Spoken Points**:
  > *"Our automated backup script executes `pg_dump -Fc` custom compression, verifies archive integrity, and computes a SHA-256 checksum stored in `.sha256`. Our restore script `scripts/restore-db.sh` validates this checksum before executing and refuses to run without an explicit `--confirm` flag to prevent accidental production overwrite."*
- **Action**: Reference the rollback procedure:
  > *"Finally, our deployment script maintains an append-only `.deployment_history` file. If a new deployment fails health verification, `scripts/rollback.sh` reads the previous known-good image tag, redeploys the previous release, and loops until `/api/v1/health/ready` confirms full recovery."*
