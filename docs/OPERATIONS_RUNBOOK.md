# Algions E-Commerce Platform — Operations Runbook

## 1. Quick Reference & Operational Commands

### 1.1 Service Lifecycle Management
| Operation | Command | Purpose / When to Run |
| :--- | :--- | :--- |
| **Initial Setup** | `bash scripts/setup.sh` | Sets up prerequisites, generates TLS certs, boots Compose, and seeds DB. |
| **Start Services** | `docker compose up -d` | Launches all containers in background mode. |
| **Stop Services** | `docker compose down` | Gracefully terminates containers without deleting persistent storage. |
| **Restart Service** | `docker compose restart api` | Restarts single container without interrupting Nginx or PostgreSQL. |
| **View Status** | `docker compose ps` | Displays state, uptime, port mappings, and Docker healthcheck status. |
| **Resource Usage** | `docker stats` | Live CPU, memory, and network I/O consumption per container. |

### 1.2 Log Inspection
```bash
# Follow structured logs from Express API in real time:
docker compose logs -f --tail=100 api

# Follow Nginx reverse proxy JSON access and error logs:
docker compose logs -f --tail=100 nginx

# View PostgreSQL error logs:
docker compose logs -f --tail=100 postgres
```

### 1.3 Linux Host Diagnostics
```bash
# Verify listening network sockets (confirm 80/443 open and 5432 internal):
ss -tulpn

# Inspect available disk space (prevent out-of-disk crashes during backups):
df -h

# Inspect host RAM availability:
free -h

# Check active system processes:
ps aux | grep -E "node|nginx|postgres"

# Inspect detailed container networking and IP assignment:
docker inspect algions-api
```

---

## 2. Health & Readiness Probing

```bash
# Quick liveness ping (Confirms Node event loop is responsive):
curl -k https://localhost/api/v1/health/live

# Deep readiness ping (Executes live database probe):
curl -k https://localhost/api/v1/health/ready

# Prometheus metrics scrape:
curl -k https://localhost/api/v1/metrics
```

---

## 3. Incident Investigation & Common Failure Scenarios

### Scenario A: `/health/ready` returns HTTP 503 (Database Disconnected)
- **Symptom**: Nginx and API are up, but requests fail or `/health/ready` reports `"status": "unhealthy"`.
- **Diagnostic Steps**:
  1. Check PostgreSQL container state:
     ```bash
     docker compose ps postgres
     ```
  2. Inspect database logs:
     ```bash
     docker compose logs --tail=50 postgres
     ```
  3. Verify PostgreSQL readiness tool:
     ```bash
     docker compose exec postgres pg_isready -U algions_user -d algions_db
     ```
- **Remediation**:
  ```bash
  # If stopped, restart PostgreSQL:
  docker compose up -d postgres

  # Once healthy, verify API reconnects automatically:
  curl -k https://localhost/api/v1/health/ready
  ```

### Scenario B: API Container Out Of Memory (OOM Crash)
- **Symptom**: `docker compose ps` shows `algions-api` Exited (137).
- **Diagnosis**:
  ```bash
  docker inspect algions-api --format='{{.State.OOMKilled}}'
  ```
- **Remediation**:
  Restart the API container. Inspect Pino logs prior to the crash for runaway payloads:
  ```bash
  docker compose restart api
  ```

### Scenario C: Bad Deployment / Regression
- **Symptom**: New release causes 500 errors or fails smoke tests.
- **Remediation**: Execute automated rollback script immediately:
  ```bash
  bash scripts/rollback.sh
  ```

---

## 4. Database Backup & Restore Runbook

### 4.1 Creating an Immediate Backup
```bash
bash scripts/backup-db.sh
```
- Backups are stored in `backups/db_backup_YYYYMMDD_HHMMSS.dump`.
- Accompanying cryptographic hash stored in `.sha256`.

### 4.2 Restoring from Backup
```bash
# Requires explicit --confirm flag to avoid accidental overwrite:
bash scripts/restore-db.sh backups/db_backup_YYYYMMDD_HHMMSS.dump --confirm
```

---

## 5. Deliberate Failure Simulation (Live Demo Procedure)

Use this sequence to demonstrate resilience to interviewers:
1. Show `/health/ready` returning `200 OK`.
2. Stop PostgreSQL:
   ```bash
   docker compose stop postgres
   ```
3. Probe `/health/ready` immediately:
   ```bash
   curl -k -i https://localhost/api/v1/health/ready
   # Returns 503 Service Unavailable with database error
   ```
4. Restart PostgreSQL:
   ```bash
   docker compose start postgres
   ```
5. Re-probe `/health/ready`:
   ```bash
   curl -k -i https://localhost/api/v1/health/ready
   # Returns 200 OK (Automatic recovery confirmed!)
   ```
