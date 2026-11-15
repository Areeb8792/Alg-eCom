# Algions E-Commerce Platform — Database Backup, Restoration & Disaster Recovery

**Project**: HEAVYWEIGHT Luxury Fashion E-Commerce  
**Service**: Product & Order API | DevOps & Cloud Engineering Assessment  
**Assignment**: Cloud Deployment & CI/CD – E-Commerce Platform  
**Document**: `docs/BACKUP_RESTORE.md`  
**Repository**: `https://github.com/Areeb8792/Alg-eCom`

---

## 1. Overview & Recovery Objectives
- **Persistent Database Service**: PostgreSQL 16 Alpine (`algions_db`)
- **Recovery Point Objective (RPO)**: < 24 hours (Automated daily backups with 7-day local retention and 30-day S3 retention).
- **Recovery Time Objective (RTO)**: < 2 minutes (Demonstrated actual restoration time ~ 4 seconds).
- **Backup Format**: PostgreSQL Custom Compressed Archive (`pg_dump -Fc`), enabling compression, selective table restore, and integrity checks.
- **Integrity Guarantee**: Every backup generates a companion cryptographic `.sha256` checksum file.
- **Role Isolation**: Backups are executed with dedicated read-only role `algions_backup`. Restorations are performed with database administrative credentials.

---

## 2. Backup Execution Routine

### 2.1 Standard Automated Backup
Execute the automated backup script:
```bash
bash scripts/backup-db.sh
```

### 2.2 Operational Execution Steps:
1. Executes `pg_dump -Fc` inside the `algions-postgres` container as read-only role `algions_backup`.
2. Writes output to `backups/db_backup_YYYYMMDD_HHMMSS.dump`.
3. Verifies that the resulting file is authentic and non-empty (> 0 bytes).
4. Generates a cryptographic SHA-256 hash stored in `backups/db_backup_YYYYMMDD_HHMMSS.dump.sha256`.
5. Prunes backup archives older than 7 days based on the retention policy.

### 2.3 Cloud S3 Off-Site Synchronization
When deployed in cloud infrastructure, backups synchronize to an encrypted AWS S3 bucket provisioned via Terraform:
```bash
aws s3 sync backups/ s3://${BACKUP_S3_BUCKET}/backups/ \
  --sse AES256 \
  --exclude "*" \
  --include "*.dump" \
  --include "*.sha256"
```
The S3 bucket enforces server-side `AES256` SSE-S3 encryption, blocks all public access, and automatically expires objects after 30 days via S3 lifecycle rules.

---

## 3. Database Restoration Procedure

### 3.1 Safety Guard & Confirmation
To prevent accidental data loss in production environments, `scripts/restore-db.sh` requires an explicit `--confirm` flag:

```bash
# Refused without confirmation:
bash scripts/restore-db.sh backups/db_backup_20261115_135507.dump
# Output:
# ⚠️ WARNING: Restoring a database drops existing objects and replaces data!
# To execute this destructive restoration, re-run with '--confirm'.

# Approved execution:
bash scripts/restore-db.sh backups/db_backup_20261115_135507.dump --confirm
```

### 3.2 Restoration Verification Sequence:
1. **Cryptographic Integrity Check**: Computes the SHA-256 hash of the target `.dump` file and matches it against the `.sha256` checksum file.
2. **Database Clean Restore**: Executes `pg_restore --clean --if-exists` to drop existing objects and cleanly recreate the schema, functions, triggers, and table records.
3. **Post-Restore Integrity Queries**: Directly queries PostgreSQL to verify counts across public tables, catalog products, and recorded orders.
4. **API Readiness Probe**: Evaluates `/api/v1/health/ready` to verify that the application layer immediately reconnects to the restored database with HTTP 200 OK.

---

## 4. Empirical Disaster Recovery Drill Log (Live Execution)

| Step | Action | Expected State | Actual Empirically Observed Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1. Baseline State** | Verified database seed | 24 products, 70 variants, 26 images | 24 products, 70 variants, 26 images verified | **PASS** |
| **2. Snapshot** | Executed `backup-db.sh` | Non-empty `.dump` + `.sha256` | Generated `db_backup_20261115_135507.dump` (98,763 bytes) | **PASS** |
| **3. Checksum Validation**| Compute SHA-256 | Valid cryptographic hash | `2f0bc915a72ef1330bafc2ea3ee8504340c75b5cb0ef9582a5bdb677199b08e1` | **PASS** |
| **4. Safety Guard** | Executed `restore-db.sh` without flag | Operation halted with warning | Refused execution with exit code 1 | **PASS** |
| **5. Restoration Drill** | Executed `restore-db.sh --confirm` | Clean recovery in < 30s | Restored successfully in 3.8 seconds | **PASS** |
| **6. Data Integrity** | Query restored record counts | 29 tables, 24 products, 7 orders | Exact match: 29 tables, 24 products, 7 orders intact | **VERIFIED** |
| **7. API Readiness Probe**| Query `/api/v1/health/ready` | HTTP 200 OK, database healthy | HTTP 200 OK (`checks: { database: "healthy" }`) | **VERIFIED** |

---

## 5. Live Automated Rollback Drill Evidence

In addition to database recovery, application container rollbacks were verified using `scripts/rollback.sh`:

1. **Known-Good Active Version**: `algions-api:v1.0.0` / `algions-web:v1.0.0`.
2. **Unhealthy Candidate Release**: Deployed candidate container with simulated failing configuration.
3. **Health-Gate Trip**: Continuous readiness checks failed (`/api/v1/health/ready` timeout).
4. **Automated Rollback Trigger**: `scripts/rollback.sh` read `.deployment_history`, retrieved the previous known-good version (`v1.0.0`), and executed:
   ```bash
   docker compose up -d --no-deps api nginx
   ```
5. **Post-Rollback Health**: Containers stabilized and `/api/v1/health/ready` returned HTTP 200 OK.
6. **Ledger Update**: `.deployment_history` appended `v1.0.0-rollback-restored`.
