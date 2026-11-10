# Algions AI Labs — DevOps System Architecture Specification

**Project**: HEAVYWEIGHT Luxury Fashion E-Commerce  
**Service**: Product & Order API | DevOps & Cloud Engineering Assessment  
**Assignment**: Cloud Deployment & CI/CD – E-Commerce Platform  
**Document**: `docs/DEVOPS_ARCHITECTURE.md`

---

## 1. System Topology & Network Architecture

The architecture is designed as an isolated, single-host containerized deployment on Linux (AWS EC2 / Ubuntu LTS), fronted by an Nginx reverse proxy terminating TLS, with internal container networking and zero public exposure of the database.

```mermaid
flowchart TD
    Client["Client Browser / Mobile<br/>(HTTPS 443 / HTTP 80)"]

    subgraph AWS_EC2["AWS EC2 Host (Amazon Linux 2023 / Ubuntu LTS)"]
        subgraph SecurityGroup["AWS Security Group (Strict Ingress)"]
            Port80["Port 80: HTTP Redirect"]
            Port443["Port 443: HTTPS TLS 1.3 / 1.2"]
            Port3001["Port 3001: Grafana (Restricted/Internal)"]
        end

        subgraph DockerBridge["Docker Network: algions-internal-bridge (Isolated)"]
            subgraph NginxContainer["Container: algions-nginx (UID 101)"]
                TLS["TLS Termination & Security Headers"]
                StaticFiles["Static React SPA (/usr/share/nginx/html)"]
                ReverseProxy["Reverse Proxy (/api/ -> api:4000)"]
            end

            subgraph APIContainer["Container: algions-api (UID 1000)"]
                ExpressApp["Node.js 22 LTS Express API"]
                PinoLogger["Pino Structured JSON Logger"]
                MetricsCollector["Prometheus Metrics (/api/v1/metrics)"]
            end

            subgraph DBContainer["Container: algions-postgres (Internal Only)"]
                PostgreSQL["PostgreSQL 16 Database<br/>(Port 5432 - NO PUBLIC ACCESS)"]
            end

            subgraph MonitorStack["Observability Stack (Internal Network)"]
                Prometheus["Container: algions-prometheus<br/>Scrapes /api/v1/metrics (10s)"]
                Grafana["Container: algions-grafana<br/>Dashboards & Visualization"]
            end
        end

        subgraph HostStorage["Persistent Volumes on Host EBS (gp3 Encrypted)"]
            PGData[("Volume: algions-postgres-storage<br/>/var/lib/postgresql/data")]
            PromData[("Volume: algions-prometheus-storage<br/>/prometheus")]
            GrafData[("Volume: algions-grafana-storage<br/>/var/lib/grafana")]
            LocalBackups["Directory: /opt/algions/backups<br/>(Compressed .dump + .sha256)"]
        end

        SSM["AWS SSM Session Manager Agent<br/>(Encrypted Shell - No Port 22)"]
    end

    subgraph ExternalAWS["AWS Cloud Managed Services"]
        S3Backups[("Encrypted S3 Bucket<br/>algions-production-backups<br/>(AES256 + 30-day Lifecycle)")]
        IAMRole["IAM Role & SSM Instance Profile<br/>AmazonSSMManagedInstanceCore"]
        GHCR["GitHub Container Registry (ghcr.io)<br/>Immutable Versioned Images"]
    end

    %% Client Traffic
    Client -->|HTTP 80| Port80
    Client -->|HTTPS 443| Port443
    Port80 -->|301 Permanent Redirect| Port443
    Port443 --> TLS

    %% Nginx Routing
    TLS -->|Static Requests /| StaticFiles
    TLS -->|API Requests /api/| ReverseProxy
    ReverseProxy -->|Internal Proxy pass| ExpressApp

    %% Backend & DB
    ExpressApp -->|ACID Transactions & Row Lock| PostgreSQL
    PostgreSQL --- PGData

    %% Observability
    Prometheus -->|Scrapes :4000/api/v1/metrics| MetricsCollector
    Prometheus --- PromData
    Grafana -->|Queries :9090| Prometheus
    Grafana --- GrafData
    Port3001 --> Grafana

    %% Host Backups & SSM
    PostgreSQL -.->|scripts/backup-db.sh (pg_dump -Fc)| LocalBackups
    LocalBackups -.->|Encrypted Sync| S3Backups
    SSM --- IAMRole
    NginxContainer --- StaticFiles
    APIContainer --- ExpressApp
    DBContainer --- PostgreSQL
```

---

## 2. Port Allocation & Exposure Matrix

| Service | Container | Internal Port | Host Port | Ingress Rule | Security Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HTTP Redirect** | `algions-nginx` | 80 | 80 | Public (0.0.0.0/0) | Mandatory HTTP 301 Redirect to HTTPS |
| **HTTPS Storefront & API** | `algions-nginx` | 443 | 443 | Public (0.0.0.0/0) | TLS 1.3 / 1.2 Encrypted Traffic |
| **Express API** | `algions-api` | 4000 | *None* | Internal bridge only | Strictly unreachable from outside Docker network |
| **PostgreSQL Database** | `algions-postgres` | 5432 | *None* | Internal bridge only | **Zero public access**; database isolated |
| **Prometheus** | `algions-prometheus`| 9090 | *None* | Internal bridge only | Scraped only within internal container network |
| **Grafana Dashboard** | `algions-grafana` | 3000 | 3001 | Restricted / Admin | Operational monitoring dashboard |
| **SSH** | *Disabled* | 22 | *None* | **DENIED (Port Closed)** | Replaced by AWS SSM Session Manager |

---

## 3. Container Security & Privilege Separation

1. **Non-Root Execution**:
   - `algions-api`: Runs under dedicated system user `node` (UID 1000, GID 1000).
   - `algions-nginx`: Master process drops privileges to user `nginx` (UID 101, GID 101) for worker processes.
   - `algions-prometheus`: Runs under user `nobody` (UID 65534).
2. **Linux Capability Dropping**:
   - `cap_drop: [ALL]` applied to application containers.
   - `security_opt: [no-new-privileges:true]` prevents privilege escalation attacks via setuid binaries.
3. **Resource Quotas**:
   - API: Limited to 1.0 CPU, 512 MB RAM.
   - Postgres: Limited to 1.0 CPU, 512 MB RAM.
   - Nginx: Limited to 0.5 CPU, 256 MB RAM.
   - Prometheus / Grafana: Limited to 0.5 CPU, 256 MB RAM each.
4. **Data Durability**:
   - Named Docker volumes (`postgres_data`, `prometheus_data`, `grafana_data`) are mounted from host storage, ensuring data survives container recreation, image updates, and restarts.
