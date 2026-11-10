# Algions AI Labs — Production Deployment & Operations Guide

**Project**: HEAVYWEIGHT Luxury Fashion E-Commerce  
**Service**: Product & Order API | DevOps & Cloud Engineering Assessment  
**Assignment**: Cloud Deployment & CI/CD – E-Commerce Platform  
**Document**: `docs/DEPLOYMENT.md`

---

## 1. Prerequisites & Target Environment

- **Operating System**: Linux Ubuntu 22.04 LTS or Amazon Linux 2023.
- **Hardware Profile**: 2 vCPUs, 2 GB RAM minimum (e.g. AWS EC2 `t3.small` or `t3.medium`).
- **Software Dependencies**:
  - Docker Engine >= 24.0
  - Docker Compose Plugin >= 2.20
  - OpenSSL >= 3.0
  - Bash >= 5.0
  - Git >= 2.40

---

## 2. Step-by-Step Production Deployment Procedure

### Step 1: Clone Repository & Create Service User
```bash
# Clone repository to deployment root
sudo git clone https://github.com/sayyeds/algions.git /opt/algions
sudo chown -R algions:algions /opt/algions
cd /opt/algions
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env` and set strict production secrets:
```bash
cp .env.example .env
chmod 600 .env

# Generate secure secrets
JWT_SECRET=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -base64 24)
ADMIN_PASSWORD=$(openssl rand -base64 18)

# Update secrets in .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" .env
sed -i "s|ADMIN_PASSWORD=.*|ADMIN_PASSWORD=${ADMIN_PASSWORD}|" .env
```

### Step 3: TLS Certificate Provisioning
For development and staging:
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
```bash
docker compose up -d --build
```

Verify that all 5 services reach `healthy` status:
```bash
docker compose ps
```

### Step 5: Execute Database Migrations & Initial Seed
```bash
docker compose exec -T api npm run db:migrate
docker compose exec -T api npm run db:seed
```

### Step 6: Post-Deployment Smoke Test
Verify all endpoints, transactional idempotency, and admin authentication:
```bash
bash scripts/smoke-test.sh https://localhost
```

---

## 3. Maintenance & Monitoring Access

- **Public Storefront**: `https://localhost` (Port 443)
- **API Liveness Probe**: `https://localhost/api/v1/health/live`
- **API Readiness Probe**: `https://localhost/api/v1/health/ready`
- **Prometheus Metrics**: `https://localhost/api/v1/metrics`
- **Grafana Dashboard**: `http://localhost:3001` (Credentials in `.env`)
