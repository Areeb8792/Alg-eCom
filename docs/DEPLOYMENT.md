# Algions AI Labs — Production Deployment & Operations Guide

**Project**: HEAVYWEIGHT Luxury Fashion E-Commerce  
**Service**: Product & Order API | DevOps & Cloud Engineering Assessment  
**Assignment**: Cloud Deployment & CI/CD – E-Commerce Platform  
**Repository**: `https://github.com/Areeb8792/Alg-eCom`  
**Document**: `docs/DEPLOYMENT.md`

---

## 1. Prerequisites & Target Environment

- **Target Architecture**: Linux Host (Ubuntu 22.04 LTS / Amazon Linux 2023) or Local Containerized Environment.
- **Hardware Profile**: 2 vCPUs, 2 GB RAM minimum (e.g., AWS EC2 `t3.medium` or local VM/Docker engine).
- **Runtime Dependencies**:
  - Docker Engine >= 24.0
  - Docker Compose Plugin >= 2.20
  - OpenSSL >= 3.0
  - Bash >= 5.0
  - Git >= 2.40

---

## 2. Deployment Architecture & Operational Scope

### Deployment Mode Clarification
- **Operational Local & Container Deployment**: Fully implemented, verified, and operational via Docker Compose. Operates 5 interconnected containers (`algions-postgres`, `algions-api`, `algions-nginx`, `algions-prometheus`, `algions-grafana`).
- **Cloud Infrastructure (AWS & Remote Automation)**: Codified and validated via Terraform (`infra/terraform/`) and Ansible (`infra/ansible/playbook.yml`). As permitted by the assessment guidelines, live AWS infrastructure has **not** been actively provisioned on an external cloud account to prevent recurring costs.
- **GitHub Actions Deployment Workflow (`deploy.yml`)**: Codified as a declarative pipeline template with parameterized environment targets. It contains the remote execution steps for SSH/SSM deployment and requires target host secrets (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`) when connected to a live cloud host.

---

## 3. Step-by-Step Production Deployment Procedure

### Step 1: Clone Repository & Setup Working Directory
```bash
# Clone the repository
git clone https://github.com/Areeb8792/Alg-eCom.git /opt/algions
cd /opt/algions
```

### Step 2: Environment Configuration & Least-Privilege Credentials
Copy `.env.example` to `.env` and set strict production secrets:
```bash
cp .env.example .env
chmod 600 .env

# Generate high-entropy cryptographic secrets
JWT_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
DB_APP_PASSWORD=$(openssl rand -base64 24)
DB_MIGRATION_PASSWORD=$(openssl rand -base64 24)
DB_BACKUP_PASSWORD=$(openssl rand -base64 24)
ADMIN_PASSWORD="AdminSecretPassword123!"

# Update configuration values
sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" .env
sed -i "s|DB_APP_PASSWORD=.*|DB_APP_PASSWORD=${DB_APP_PASSWORD}|" .env
sed -i "s|DB_MIGRATION_PASSWORD=.*|DB_MIGRATION_PASSWORD=${DB_MIGRATION_PASSWORD}|" .env
sed -i "s|DB_BACKUP_PASSWORD=.*|DB_BACKUP_PASSWORD=${DB_BACKUP_PASSWORD}|" .env
```

### Step 3: TLS Certificate Provisioning
For development and staging environments:
```bash
bash infra/nginx/generate-certs.sh
```

For production public domains (Let's Encrypt / Certbot):
```bash
sudo certbot certonly --standalone -d yourdomain.com
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem infra/nginx/ssl/server.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem infra/nginx/ssl/server.key
sudo chmod 600 infra/nginx/ssl/server.key
```

### Step 4: Launch Production Container Stack
Using the local multi-container build:
```bash
docker compose up -d --build
```

Or deploying pre-published versioned images from GitHub Container Registry (GHCR):
```bash
IMAGE_TAG=v1.0.5 docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Verify that all services report healthy status:
```bash
docker compose ps
```

### Step 5: Execute Database Migrations & Initial Seed
```bash
# Run schema migrations as algions_admin
docker compose run --rm migration

# Seed catalog products (24 luxury pieces, 70 variants, 26 images)
docker compose exec -T api npm run db:seed
```

### Step 6: Post-Deployment Smoke Test
Verify health probes, transactional order creation, idempotency replay, and admin authentication:
```bash
bash scripts/smoke-test.sh https://localhost
```

---

## 4. Maintenance & Monitoring Access Endpoints

| Service | Access URL | Authentication / Binding |
| :--- | :--- | :--- |
| **Public Storefront** | `https://localhost/` | Port 443 TLS (Port 80 auto-redirects) |
| **API Direct** | `http://localhost:4000/api/v1` | Internal network / localhost binding |
| **Liveness Probe** | `https://localhost/api/v1/health/live` | Public HTTP 200 health check |
| **Readiness Probe** | `https://localhost/api/v1/health/ready` | Deep database connectivity ping |
| **Prometheus UI** | `http://localhost:9090` | Internal bridge network |
| **Grafana Dashboard** | `http://127.0.0.1:3001` | Bound strictly to loopback interface |
