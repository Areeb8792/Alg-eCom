# Algions AI Labs — Linux Host Operations & Troubleshooting Runbook

**Project**: HEAVYWEIGHT Luxury Fashion E-Commerce  
**Service**: Product & Order API | DevOps & Cloud Engineering Assessment  
**Assignment**: Cloud Deployment & CI/CD – E-Commerce Platform  
**Document**: `docs/LINUX_RUNBOOK.md`

---

## 1. Standard Operational Scripts Overview

All operational scripts reside in the `scripts/` directory, enforce `set -Eeuo pipefail` for strict error handling, and support standard Unix exit codes (0 for success, non-zero for error).

```text
scripts/
├── setup.sh         # Idempotent environment initialization & container build
├── deploy.sh        # Versioned application release with health verification
├── rollback.sh      # Automated emergency restoration to previous known-good image
├── health-check.sh  # Quick liveness & readiness probe diagnostic
├── smoke-test.sh    # 8-step end-to-end curl assertion test suite
├── backup-db.sh     # Compressed pg_dump (-Fc) with SHA-256 checksum & pruning
└── restore-db.sh    # Safe pg_restore with mandatory --confirm flag & verification
```

---

## 2. Step-by-Step Script Usage Guide

### 2.1 Initial Environment Setup (`scripts/setup.sh`)
Executes dependency checks, creates `.env` from `.env.example` if missing, generates local self-signed TLS certificates, builds container images, and launches the Compose stack:

```bash
bash scripts/setup.sh
```

### 2.2 Versioned Deployment (`scripts/deploy.sh`)
Deploys a specific tagged container release, runs database migrations, records the tag in `.deployment_history`, and polls `/api/v1/health/ready`:

```bash
# Deploy latest or specific semantic release tag
bash scripts/deploy.sh v1.0.0
```

### 2.3 Emergency Rollback (`scripts/rollback.sh`)
Triggered automatically on failed deployment verification or invoked manually by an operator. Reads `.deployment_history` to identify the last healthy version tag and redeploys:

```bash
bash scripts/rollback.sh
```

### 2.4 Quick Health Diagnostic (`scripts/health-check.sh`)
Queries both `/api/v1/health/live` and `/api/v1/health/ready` to assess process health and PostgreSQL connectivity:

```bash
# Target local or remote host
bash scripts/health-check.sh https://localhost
# Or target direct backend port
bash scripts/health-check.sh http://localhost:4000
```

### 2.5 Automated Smoke Test Suite (`scripts/smoke-test.sh`)
Executes 8 live curl assertions against the running API covering liveness, catalog retrieval, admin JWT login, stock adjustments, order creation with `Idempotency-Key`, replay verification, and 409 conflict handling:

```bash
bash scripts/smoke-test.sh https://localhost
```

### 2.6 Database Backup Routine (`scripts/backup-db.sh`)
Performs a compressed binary dump of the PostgreSQL database (`-Fc`), generates a cryptographic SHA-256 checksum file, and applies a 7-day retention policy:

```bash
bash scripts/backup-db.sh
# Output saved in backups/db_backup_YYYYMMDD_HHMMSS.dump and .dump.sha256
```

### 2.7 Database Safe Restoration (`scripts/restore-db.sh`)
Restores an existing backup into PostgreSQL. Enforces an explicit safety guard requiring the `--confirm` flag to prevent accidental data overwrites:

```bash
# Safe verification attempt (refuses without --confirm)
bash scripts/restore-db.sh backups/db_backup_20261110_120000.dump

# Intentional restoration execution
bash scripts/restore-db.sh backups/db_backup_20261110_120000.dump --confirm
```

---

## 3. Practical Linux Troubleshooting Commands

### 3.1 Docker & Container Lifecycle Troubleshooting
```bash
# List all running containers with health status
docker compose ps

# Inspect recent container crash or restart reasons
docker inspect --format='{{range .State.ExitCode}}ExitCode: {{.}}{{end}}' algions-api

# Follow real-time streaming logs for a specific service
docker compose logs -f api
docker compose logs -f nginx
docker compose logs -f postgres

# View container resource utilization (CPU, memory, network I/O)
docker stats --no-stream
```

### 3.2 Process & System Resource Inspection
```bash
# Identify running Node.js or Nginx processes
ps aux | grep -E 'node|nginx|postgres'

# Check system memory consumption (RAM and Swap)
free -h

# Check disk space utilization on root volume and Docker storage
df -h
du -sh /var/lib/docker/volumes/*

# View top CPU and memory consuming processes
top -b -n 1 | head -n 20
```

### 3.3 Network & Port Binding Troubleshooting
```bash
# Check active listening ports on host (verify only 80 and 443 are listening)
ss -tulpn | grep -E ':(80|443|4000|5432)'

# Test internal container-to-container connectivity
docker compose exec api wget -qO- http://localhost:4000/api/v1/health/live

# Probe Nginx TLS termination with detailed SSL handshake diagnostics
curl -Iv https://localhost/api/v1/health/live --cacert infra/nginx/ssl/server.crt

# Test HTTP to HTTPS redirection
curl -I http://localhost/
```

### 3.4 PostgreSQL Connection Diagnostics
```bash
# Verify PostgreSQL readiness from inside the Docker bridge network
docker compose exec postgres pg_isready -U algions_user -d algions_db

# Connect to database via psql shell
docker compose exec postgres psql -U algions_user -d algions_db

# Query active connections and locks
docker compose exec postgres psql -U algions_user -d algions_db -c "
  SELECT pid, client_addr, state, query 
  FROM pg_stat_activity 
  WHERE datname = 'algions_db';
"

# Check table record counts and stock consistency
docker compose exec postgres psql -U algions_user -d algions_db -c "
  SELECT 
    (SELECT count(*) FROM products) as products_count,
    (SELECT count(*) FROM orders) as orders_count,
    (SELECT count(*) FROM audit_events) as audit_events_count;
"
```
