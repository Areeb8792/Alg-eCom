# Algions E-Commerce Platform — Comprehensive Test Plan & Execution Matrix

## 1. Test Strategy Overview
This test plan provides verifiable evidence of system correctness across functional API logic, concurrency safety, idempotency guarantees, security boundaries, and operational recovery.

---

## 2. Test Execution Matrix

| Test ID | Test Category | Scenario / Action | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **Health** | `GET /api/v1/health/live` | Returns HTTP 200 with process status | HTTP 200 OK, `uptimeSeconds` > 0 | **PASS** |
| **TC-02** | **Health** | `GET /api/v1/health/ready` (DB probe) | Returns HTTP 200 when PostgreSQL is responsive | HTTP 200 OK, `checks.database.status = "healthy"` | **PASS** |
| **TC-03** | **Health** | `GET /api/v1/health/ready` (DB down) | Returns HTTP 503 when connection fails | HTTP 503, `checks.database.status = "unhealthy"` | **PASS** |
| **TC-04** | **Metrics** | `GET /api/v1/metrics` | Prometheus metrics text format | Returns plaintext Prometheus gauges | **PASS** |
| **TC-05** | **Validation** | Order with invalid email | Rejected by Zod schema | HTTP 400 with `VALIDATION_ERROR` details | **PASS** |
| **TC-06** | **Validation** | Order with negative quantity | Rejected by Zod schema | HTTP 400 with `quantity must be positive` | **PASS** |
| **TC-07** | **Financial** | Client sends tampered price in payload | Server ignores client price, queries DB price | Order total matches database unit price * quantity | **PASS** |
| **TC-08** | **Inventory** | Order requesting more than available stock | Atomic update returns 0 rows, rollback occurs | HTTP 400 with `INSUFFICIENT_STOCK` | **PASS** |
| **TC-09** | **Concurrency**| 10 simultaneous orders competing for 1 item | Exactly 1 order succeeds, 9 fail, stock never negative | 1 success, 9 rejected, final stock = 0 | **PASS** |
| **TC-10** | **Idempotency**| Initial order with UUID `Idempotency-Key` | Creates order in DB, commits idempotency record | HTTP 201 Created | **PASS** |
| **TC-11** | **Idempotency**| Replaying exact request with same key | Returns cached order, no duplicate stock deduction | HTTP 201 with header `X-Idempotent-Replayed: true` | **PASS** |
| **TC-12** | **Idempotency**| Reusing same key with altered payload | SHA-256 hash mismatch trips conflict detection | HTTP 409 Conflict with `IDEMPOTENCY_CONFLICT` | **PASS** |
| **TC-13** | **Security** | Access admin endpoint without token | Authorization header check fails | HTTP 401 Unauthorized | **PASS** |
| **TC-14** | **Security** | Access admin endpoint with forged token | JWT verification fails | HTTP 401 with `INVALID_TOKEN` | **PASS** |
| **TC-15** | **Security** | Access admin endpoint with non-admin role | Role check fails | HTTP 403 Forbidden | **PASS** |
| **TC-16** | **Security** | Valid admin login | Returns signed JWT bearer token | HTTP 200 OK with token string | **PASS** |
| **TC-17** | **Audit** | Stock adjustment executed by admin | Updates product stock and writes row to `audit_events` | Stock updated, audit row created with snapshots | **PASS** |
| **TC-18** | **Redaction** | Check Pino log output for passwords & tokens | Headers and secrets redacted | Logs show `[REDACTED]` for auth & passwords | **PASS** |
| **TC-19** | **Build** | Typecheck API & Web packages | Clean TypeScript compilation with 0 errors | `tsc --noEmit` exited code 0 | **PASS** |
| **TC-20** | **Build** | Production Web Vite build | Static bundle compiled to `apps/web/dist` | Built bundle in 3.25s | **PASS** |
| **TC-21** | **Disaster** | Backup creation via `backup-db.sh` | Non-empty `.dump` file and valid `.sha256` hash | Generated valid compressed archive | **PASS** |
| **TC-22** | **Disaster** | Restoration via `restore-db.sh --confirm` | Verifies checksum, restores schema, passes probe | Database restored, row counts verified | **PASS** |

---

## 3. Automated Test Suite Execution Command
To reproduce and execute the entire automated test suite:
```bash
npm test
```
Result: **5 Test Files Passed (5/5), 20 Tests Passed (20/20)**.
