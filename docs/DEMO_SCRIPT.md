# Algions E-Commerce Platform — 3–5 Minute Technical Demonstration Script

This script is structured for a concise, high-impact technical demo during a live interview.

---

## Part 1: Architecture & Design System (Minute 0:00 – 1:00)
- **Action**: Open the browser to `https://localhost` (Storefront Home).
- **Spoken Points**:
  > *"Here is the HEAVYWEIGHT luxury fashion e-commerce storefront. It follows the exact Superdesign draft `df189593-ef46-4348-841e-a68cf7d4f972` — brutalist editorial typography with Anton headings, Space Grotesk metadata, grain texture overlay, and real-time inventory synchronization."*
- **Action**: Point out the floating **Health Signal** pill in the lower left corner:
  > *"Notice the real-time DevOps health signal: the API reports LIVE and the PostgreSQL connection reports READY with low query latency."*

---

## Part 2: Order Creation & Idempotency Enforcement (Minute 1:00 – 2:30)
- **Action**: Click on a product (e.g. `Statement Puffer`), select Quantity 2, click `ADD TO BAG`.
- **Action**: Open Shopping Bag (`/checkout`).
- **Spoken Points**:
  > *"In the checkout workflow, notice this green box displaying the active `Idempotency-Key` UUID. All monetary calculations are performed strictly on the server in integer cents ($280.00 = 28000 cents), preventing client price tampering."*
- **Action**: Click `PLACE ORDER`.
- **Observation**: Order confirms with reference `HW-2024-XXXX`.
- **Action**: Navigate back to Checkout, click `TEST IDEMPOTENCY (RE-SEND EXACT SAME KEY)`.
- **Spoken Points**:
  > *"When we replay the request with the identical key, the backend returns the cached order immediately with the header `X-Idempotent-Replayed: true`. Most importantly, stock is not deducted a second time."*
- **Action**: Show what happens if the payload is altered with the same key:
  > *"If the payload is modified while reusing the key, the backend's SHA-256 hash comparison trips and rejects the request with HTTP 409 Conflict."*

---

## Part 3: Protected Admin & Immutable Audit Events (Minute 2:30 – 3:30)
- **Action**: Click `OPERATIONS (ADMIN)` in the header. Log in with `admin@algions.com` / `AdminSecretPassword123!`.
- **Action**: Adjust stock for `Statement Puffer` (+5 pieces, reason: `"Restock"`).
- **Spoken Points**:
  > *"All administrative operations are protected with JWT tokens. When we commit this stock adjustment, an immutable audit event is immediately appended to PostgreSQL with actor ID, before/after snapshots, and request correlation ID."*
- **Action**: Point out the updated row in the Audit Log table.

---

## Part 4: Deliberate Failure, Observability & Recovery (Minute 3:30 – 5:00)
- **Action**: Open terminal, show readiness check:
  ```bash
  curl -k https://localhost/api/v1/health/ready
  # Returns 200 OK
  ```
- **Action**: Stop PostgreSQL:
  ```bash
  docker compose stop postgres
  curl -k -i https://localhost/api/v1/health/ready
  # Returns 503 Service Unavailable with database disconnected
  ```
- **Spoken Points**:
  > *"Notice that `/health/live` remains 200 because the Node process is running, but `/health/ready` immediately flags 503. The frontend status indicator turns red."*
- **Action**: Restart PostgreSQL:
  ```bash
  docker compose start postgres
  curl -k https://localhost/api/v1/health/ready
  # Automatically recovers and returns 200 OK
  ```
- **Action**: Demonstrate the backup script:
  ```bash
  bash scripts/backup-db.sh
  ```
- **Spoken Points**:
  > *"Our automated backup script executes `pg_dump -Fc`, verifies file size, generates a SHA-256 checksum, and cleans up backups older than 7 days. Our restore script verifies this checksum before any destructive restore."*
