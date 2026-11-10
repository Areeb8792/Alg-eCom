# Algions E-Commerce Platform — System Architecture & Engineering Design

## 1. High-Level Architecture Overview

The **Algions E-Commerce Platform** is designed around a single, domain-specific, high-reliability **Product and Order Service**. The architecture prioritizes reproducibility, transactional correctness, zero-data-loss recovery, and operational observability.

```mermaid
flowchart TD
    Client["HTTPS Client / Browser\n(Web Storefront)"]
    Admin["HTTPS Client\n(Admin Operations)"]

    subgraph Host_DMZ ["Public Host Interface"]
        direction TB
        Port443["Port 443 (HTTPS)"]
        Port80["Port 80 (HTTP 301 Redirect)"]
    end

    subgraph Internal_Bridge ["Docker Isolated Bridge Network (algions-internal-bridge)"]
        direction TB
        NginxProxy["Nginx Reverse Proxy & Static SPA Delivery\n(algions-nginx)"]
        
        subgraph AppTier ["Application Tier"]
            NodeAPI["Node.js LTS / Express API\n(algions-api :4000)\nNon-root 'node' UID 1000"]
        end

        subgraph DataTier ["Data Tier (Isolated)"]
            PostgresDB[("PostgreSQL 16\n(algions-postgres :5432)\nPersistent Storage: algions-postgres-storage")]
        end
    end

    Client -->|HTTPS :443| Port443 --> NginxProxy
    Client -.->|HTTP :80| Port80 -->|301 Redirect| Port443
    Admin -->|HTTPS :443| Port443 --> NginxProxy

    NginxProxy -->|Static Assets| NginxProxy
    NginxProxy -->|Proxy /api/v1/*| NodeAPI
    NodeAPI -->|Connection Pool (pg)| PostgresDB
```

---

## 2. Network Architecture & Security Boundaries

### 2.1 Port Exposure Matrix
| Service | Container Port | Host Port | Ingress Source | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Nginx** | `80/tcp` | `80/tcp` | `0.0.0.0/0` | Redirects all plain HTTP traffic to HTTPS via 301. |
| **Nginx** | `443/tcp` | `443/tcp` | `0.0.0.0/0` | TLS Termination, static React delivery, and API reverse proxy. |
| **API** | `4000/tcp` | **None** | `internal_network` only | Express API backend. Never exposed directly on host interface. |
| **PostgreSQL**| `5432/tcp` | **None** | `internal_network` only | Relational persistence. Never published to the public host. |

### 2.2 Why the Database Port (5432) is Not Exposed
Exposing raw database ports to host interfaces creates significant attack vectors:
- Brute-force dictionary attacks against PostgreSQL authentication.
- Potential zero-day exploits in database listener daemons.
- Unauthorized connection attempts bypassing reverse proxy rate limiting, WAFs, and correlation logging.

By binding PostgreSQL strictly to the Docker bridge network `internal_network`, only the `api` container can initiate TCP handshakes to port `5432`.

---

## 3. Application Tier Architecture (Layered Hexagonal / Clean Separation)

The backend follows a strict separation of concerns:

```mermaid
flowchart LR
    Router["Express Router\n(/api/v1)"]
    Middleware["Middlewares\n(Correlation, Redaction, Auth, Idempotency)"]
    Controller["Controllers\n(HTTP validation, Status mapping)"]
    Service["Domain Services\n(Business Logic, Total Calculation)"]
    Repository["Repositories\n(Atomic SQL, Transactions, Snapshots)"]
    Database[("PostgreSQL DB")]

    Router --> Middleware --> Controller --> Service --> Repository --> Database
```

1. **Routing & Middleware**:
   - `requestLogger`: Generates UUID correlation ID and logs structured JSON upon response completion.
   - `auth`: Decodes and validates JWT bearer tokens for administrative endpoints.
   - `idempotency`: Validates `Idempotency-Key` headers and checks conflict states.
2. **Controllers**:
   - Parse and validate payloads using Zod schemas. Never access the database directly.
3. **Services**:
   - Core domain logic: price calculations from internal database records, inventory state transitions, audit logging dispatch.
4. **Repositories**:
   - Raw parameterized SQL (`pg`). Handle row-level locking (`FOR UPDATE`), atomic updates, and rollback boundaries.

---

## 4. Database Schema & Snapshot Design

```mermaid
erDiagram
    PRODUCTS ||--o{ ORDER_ITEMS : "referenced_in"
    ORDERS ||--|{ ORDER_ITEMS : "contains"
    ORDERS ||--o| IDEMPOTENCY_KEYS : "associated_with"
    ADMIN_USERS ||--o{ AUDIT_EVENTS : "triggers"

    PRODUCTS {
        uuid id PK
        varchar sku UK
        varchar slug UK
        varchar name
        text description
        varchar category
        int price_cents
        varchar currency
        int stock
        boolean is_active
        text image_url
        timestamptz created_at
        timestamptz updated_at
    }

    ORDERS {
        uuid id PK
        varchar order_reference UK
        varchar customer_email
        varchar customer_name
        varchar status
        int subtotal_cents
        varchar currency
        timestamptz created_at
        timestamptz updated_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        varchar product_name_snapshot
        varchar sku_snapshot
        int unit_price_cents_snapshot
        varchar currency_snapshot
        timestamptz created_at
    }

    IDEMPOTENCY_KEYS {
        varchar key PK
        varchar request_hash
        varchar status
        uuid order_id FK
        int response_code
        jsonb response_body
        timestamptz created_at
        timestamptz updated_at
    }

    ADMIN_USERS {
        uuid id PK
        varchar username UK
        varchar password_hash
        varchar role
        timestamptz created_at
    }

    AUDIT_EVENTS {
        uuid id PK
        uuid actor_id
        varchar actor_username
        varchar action
        varchar resource_type
        varchar resource_id
        jsonb before_state
        jsonb after_state
        varchar correlation_id
        timestamptz created_at
    }
```

### Financial Safety & Snapshots
- **Integer Minor Units**: Prices and subtotals are stored as integer cents (`$140.00` = `14000`), completely eliminating IEEE 754 floating-point rounding anomalies.
- **Historic Snapshots**: In `order_items`, `product_name_snapshot`, `sku_snapshot`, and `unit_price_cents_snapshot` freeze the state of the product at purchase time. Subsequent price changes or product renames never alter historic order totals.

---

## 5. CI/CD Architecture & Release Flow

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Git as GitHub Repository
    participant CI as GitHub Actions (CI)
    participant GHCR as GitHub Container Registry (GHCR)
    participant Host as Production Linux Host

    Dev->>Git: git push / Pull Request
    Git->>CI: Trigger ci.yml
    CI->>CI: Typecheck (tsc) & Lint (eslint)
    CI->>CI: Run Automated Tests (Vitest)
    CI->>CI: Docker Build Verification
    
    alt Release Condition (Tag or Main Push)
        Git->>CI: Trigger release.yml
        CI->>GHCR: Build & Tag Images with Commit SHA & Release Tag
        CI->>GHCR: Push Images & Capture Digest
    end

    alt Deployment Trigger
        Dev->>CI: Trigger deploy.yml (Version Tag)
        CI->>Host: Pull Versioned Image by SHA
        Host->>Host: Execute Database Migrations
        Host->>Host: docker compose up -d (Zero-Downtime)
        Host->>Host: Probe /api/v1/health/ready
        alt Probe Fails
            Host->>Host: Auto-Trigger scripts/rollback.sh
        else Probe Succeeds
            Host-->>CI: Deployment Verified
        end
    end
```
