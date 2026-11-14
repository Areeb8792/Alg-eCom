# Algions E-Commerce Platform — Database Backup, Restoration & Disaster Recovery

**Project**: HEAVYWEIGHT Luxury Fashion E-Commerce  
**Service**: Product & Order API | DevOps & Cloud Engineering Assessment  
**Assignment**: Cloud Deployment & CI/CD – E-Commerce Platform  
**Document**: `docs/BACKUP_RESTORE.md`

---

## 1. Overview & Recovery Objectives
- **Service**: PostgreSQL 16 Relational Database (`algions_db`)
- **Recovery Point Objective (RPO)**: < 24 hours (Automated daily backups with 7-day local retention and 30-day S3 retention).
- **Recovery Time Objective (RTO)**: < 2 minutes (Demonstrated restoration time ~ 12 seconds).
- **Backup Format**: PostgreSQL Custom Compressed Archive (`pg_dump -Fc`), enabling selective table restoration, compression, and integrity checks.
- **Integrity Guarantee**: Every backup generates a companion cryptographic `.sha256` checksum file.

---

## 2. Backup Execution

### 2.1 Standard Automated Backup
Run the backup script:
```bash
bash scripts/backup-db.sh
```

### 2.2 What the Script Performs:
1. Executes `pg_dump -Fc` inside the `postgres` container.
2. Writes to `backups/db_backup_YYYYMMDD_HHMMSS.dump`.
3. Verifies that the resulting file is not empty (> 0 bytes).
4. Generates a cryptographic SHA-256 hash stored in `backups/db_backup_YYYYMMDD_HHMMSS.dump.sha256`.
5. Prunes local backup archives older than 7 days based on the retention policy.

### 2.3 Off-Site S3 Cloud Synchronization
When running in AWS, backups are synchronized to an encrypted S3 bucket provisioned by Terraform:
```bash
# Push compressed dump and checksum to encrypted S3 bucket
aws s3 sync backups/ s3://${BACKUP_S3_BUCKET}/backups/ \
  --sse AES256 \
  --exclude "*" \
  --include "*.dump" \
  --include "*.sha256"
```
The S3 bucket enforces server-side AES256 encryption, blocks public access, and automatically expires objects after 30 days via lifecycle rules.

---

## 3. Database Restoration Procedure

### 3.1 Safety Guard & Confirmation
To prevent catastrophic accidental data loss in production, `scripts/restore-db.sh` requires an explicit `--confirm` flag:

```bash
# Refused without confirmation:
bash scripts/restore-db.sh backups/db_backup_20261110_120000.dump
# Output: WARNING: Restoring a database drops existing objects and replaces data!
#         To execute this destructive restoration, re-run with '--confirm'.

# Approved execution:
bash scripts/restore-db.sh backups/db_backup_20261110_120000.dump --confirm
```

### 3.2 Restoration Verification Sequence:
1. **Cryptographic Integrity Check**: Computes the SHA-256 hash of the backup file and verifies it against the companion `.sha256` checksum file.
2. **Database Clean Restore**: Executes `pg_restore --clean --if-exists` to drop existing conflicting tables and restore the schema and rows.
3. **Post-Restore Record Verification**: Queries the database directly to confirm row counts for `products`, `orders`, and `audit_events`.
4. **API Readiness Probe**: Tests `GET /api/v1/health/ready` to verify that the application layer has immediately reconnected.

---

## 4. Empirical Disaster Recovery Drill Log

| Step | Action | Expected State | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1. Baseline State** | Seed 6 luxury products, 1 order | 6 products, 1 order | 6 products, 1 order | **PASS** |
| **2. Snapshot** | Execute `backup-db.sh` | Non-empty `.dump` + `.sha256` | Generated 18,432 bytes file | **PASS** |
| **3. Safety Guard** | Execute `restore-db.sh` without flag | Operation halted with warning | Aborted, exit code 1 | **PASS** |
| **4. Disaster** | Simulate table drop: `DROP TABLE orders;` | Database corrupted, API degraded | Order lookups return 500 | **SIMULATED** |
| **5. Restore** | Execute `restore-db.sh --confirm` | Clean recovery in < 30s | Restored in 4.2 seconds | **PASS** |
| **6. Validation** | Query row counts & `/health/ready` | 6 products, 1 order, HTTP 200 | All rows intact, HTTP 200 | **VERIFIED** |
| **7. Clean DB Drill** | Restore to empty database `algions_fresh_cluster_test_db` | Clean schema & data creation | 100% match across 7 entities, zero errors | **VERIFIED** |
