# HEAVYWEIGHT // SEASON 04 — Complete Technology Stack & Architecture Audit

**Repository:** `https://github.com/Areeb8792/Alg-eCom`  
**Base Release Tag:** `v1.0.4`  
**Active Working Branch:** `main`  
**Architecture Classification:** Monorepo (Node.js npm workspaces), Containerized Multi-Tier Microservices with Least-Privilege PostgreSQL Database  

---

## Executive Summary & System Blueprint

The HEAVYWEIGHT // SEASON 04 platform is a luxury brutalist fashion e-commerce application engineered with high-durability operational standards, strict least-privilege security policies, end-to-end containerization, and automated CI/CD gating. The monorepo incorporates a React 18 single-page application (SPA), an Express 4 RESTful API with Zod validation and structured Pino logging, a PostgreSQL 16 relational database with row-level pessimistic locking and append-only cryptographic audit trails, an Nginx reverse proxy with automated TLS termination and compression, and an observability subsystem powered by Prometheus and Grafana.

---

## 1. Frontend Technology Stack

The frontend application is housed in [`apps/web`](file:///d:/My%20personal/algions/apps/web) and operates as a client-side Single-Page Application (SPA) compiled through Vite.

### Core Framework & Rendering Architecture
- **React (`18.3.1`) & React DOM (`18.3.1`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* Powers the component-based declarative user interface. Utilizes React 18 concurrent rendering features, functional components, custom hooks, and StrictMode execution.  
  *Key Evidence:* [`apps/web/package.json`](file:///d:/My%20personal/algions/apps/web/package.json#L14-L15), [`apps/web/src/main.tsx`](file:///d:/My%20personal/algions/apps/web/src/main.tsx#L1-L15).
- **TypeScript (`5.7.3` / Resolved `5.9.3`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* Provides end-to-end type safety, strict interface contracts for product entities, order payloads, customer sessions, and API error envelopes.  
  *Key Evidence:* [`apps/web/tsconfig.json`](file:///d:/My%20personal/algions/apps/web/tsconfig.json), [`apps/web/src/types/index.ts`](file:///d:/My%20personal/algions/apps/web/src/types/index.ts).

### Build Tooling & Bundling
- **Vite (`6.0.7` / Resolved `6.4.6`) with `@vitejs/plugin-react` (`4.3.4`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* Provides instant Hot Module Replacement (HMR) for local developer experience, ES module resolution, dual-stack network binding, and optimized Rollup production builds with Brotli/Gzip tree-shaking.  
  *Key Evidence:* [`apps/web/vite.config.ts`](file:///d:/My%20personal/algions/apps/web/vite.config.ts#L1-L28).

### Routing & Navigation
- **React Router DOM (`7.18.5`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* Declarative client-side routing with deep-link parameter handling, route protection guards, and scroll restoration. Routes include `/` (Homepage & Catalog), `/collections/:category` (Category archive), `/product/:id` (Product Detail), `/account` (Customer portal & preferences), `/auth/verify-email` (Verification gateway), and `/order/:id` (Order Tracking).  
  *Key Evidence:* [`apps/web/src/App.tsx`](file:///d:/My%20personal/algions/apps/web/src/App.tsx#L1-L60).

### Styling Architecture & Utility System
- **Tailwind CSS (`3.4.17` / Resolved `3.4.19`) with PostCSS (`8.5.1`) & Autoprefixer (`10.4.20`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* Custom brutalist utility token system defining the Season 04 concrete palette, asymmetric borders, uppercase micro-typography, and high-contrast brutalist surfaces.  
  *Key Evidence:* [`apps/web/tailwind.config.js`](file:///d:/My%20personal/algions/apps/web/tailwind.config.js#L1-L35), [`apps/web/src/index.css`](file:///d:/My%20personal/algions/apps/web/src/index.css#L1-L85).
- **`clsx` (`2.1.1`) & `tailwind-merge` (`2.6.0` / Resolved `2.6.1`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* Utility function `cn()` resolving dynamic conditional class composition without CSS cascade conflicts.  
  *Key Evidence:* [`apps/web/src/utils/cn.ts`](file:///d:/My%20personal/algions/apps/web/src/utils/cn.ts#L1-L6).

### State Management & React Context Providers
1. **`CartContext` (`CartContext.tsx`)**  
   *Status:* `IMPLEMENTED` | `VERIFIED`  
   *Functionality:* Manages bag state, item quantity increment/decrement, size/color variant selection, total price calculation, slide-over bag drawer open/close state, and automatic persistent synchronization with browser `localStorage`.  
   *Key Evidence:* [`apps/web/src/context/CartContext.tsx`](file:///d:/My%20personal/algions/apps/web/src/context/CartContext.tsx#L1-L85).
2. **`AuthContext` (`AuthContext.tsx`)**  
   *Status:* `IMPLEMENTED` | `VERIFIED`  
   *Functionality:* Handles customer authentication session state, bearer token storage in memory/storage, automatic token refresh calls to `/api/v1/auth/refresh`, registration, login, logout, and customer profile synchronization.  
   *Key Evidence:* [`apps/web/src/context/AuthContext.tsx`](file:///d:/My%20personal/algions/apps/web/src/context/AuthContext.tsx#L1-L180).

### API Communication & Data Fetching
- **Native Browser `fetch` Wrapper (`services/api.ts`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Functionality:* Centralized HTTP client handling base URL routing (`/api/v1`), automatic correlation ID generation (`X-Correlation-ID`), Bearer authentication header injection, credential inclusion for refresh cookies (`credentials: 'include'`), and unified error parsing with `ApiError` class.  
  *Key Evidence:* [`apps/web/src/services/api.ts`](file:///d:/My%20personal/algions/apps/web/src/services/api.ts#L1-L220).

### Icons & Visual Assets
- **Lucide React (`0.473.0`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* High-precision SVG iconography (`ShoppingBag`, `ShieldCheck`, `ArrowRight`, `Search`, `Menu`, `X`, `CheckCircle2`, `AlertTriangle`, `Database`, `Activity`, `User`, `Filter`).  
  *Key Evidence:* [`apps/web/package.json`](file:///d:/My%20personal/algions/apps/web/package.json#L13).

---

## 2. UI/UX and Design System

The platform visual identity embodies the **HEAVYWEIGHT // SEASON 04** Brutalist Industrial-Luxury aesthetic. It rejects generic e-commerce templates in favor of physical garment metadata, architectural typography, raw concrete textures, high-contrast borders, and technical data stamps.

### Colour Palette & Design Tokens
Defined directly in [`apps/web/tailwind.config.js`](file:///d:/My%20personal/algions/apps/web/tailwind.config.js#L12-L22):
- **Raw Concrete Canvas (`#E3E2DE`)**: Warm industrial grey base canvas (`concrete-100`).
- **Heavy Ink Black (`#1B0E0D`)**: Primary typography, heavy borders, dark contrast blocks (`ink`).
- **Industrial Burnt Red (`#C72A09`)**: Urgency cues, stock warnings, active highlights, key calls-to-action (`burnt-red`).
- **Accent Neon Green (`#31EF07`)**: System health live signals, active indicators, stock verification accents (`neon-green`).
- **Deep Raw Umber (`#61220F`)**: Secondary accents, earthy contrast elements (`deep-brown`).
- **Subtle Surface Grey (`#DCD9D2`)**: Secondary card backgrounds, border definitions (`concrete-200`).

### Typography Architecture
1. **Display Typography (`font-anton`)**: Headings, editorial titles, massive category banners, brutalist hero banners. Loaded via Google Fonts (`Anton, sans-serif`).
2. **Body & Interface Typography (`font-sans` / `Space Grotesk`)**: Clean geometric clarity for product names, descriptions, form fields, and navigation.
3. **Metadata & Monospace Typography (`font-mono`)**: Technical product specifications (e.g., `GSM: 480`, `FABRIC: 100% FRENCH TERRY`, `COLLECTION: S04-ARCHIVE`, `ID: 04-JKT-001`, `TIMESTAMP: 2026-11-15T18:45:00Z`).

### Reusable UI Components
- **`Header.tsx`** ([`apps/web/src/components/Header.tsx`](file:///d:/My%20personal/algions/apps/web/src/components/Header.tsx)): Persistent brutalist navigation bar featuring brand identity, collection links, live search bar, category navigation pill drawer, customer account icon, and bag counter badge.
- **`Hero.tsx`** ([`apps/web/src/components/Hero.tsx`](file:///d:/My%20personal/algions/apps/web/src/components/Hero.tsx)): Responsive editorial hero section with dual typography (`COUTURE / ESSENTIALS`), dynamic season ticker, and viewport-adaptive imagery.
- **`ProductCard.tsx`** ([`apps/web/src/components/ProductCard.tsx`](file:///d:/My%20personal/algions/apps/web/src/components/ProductCard.tsx)): Industrial product card showcasing editorial photography, hover zoom, variant swatches, live stock level tags, price in USD, and quick-add actions.
- **`CartDrawer.tsx`** ([`apps/web/src/components/CartDrawer.tsx`](file:///d:/My%20personal/algions/apps/web/src/components/CartDrawer.tsx)): Slide-over shopping bag with real-time subtotal, item removal, quantity spinners, and direct checkout call-to-action.
- **`HealthSignal.tsx`** ([`apps/web/src/components/HealthSignal.tsx`](file:///d:/My%20personal/algions/apps/web/src/components/HealthSignal.tsx)): Fixed bottom-left brutalist glassmorphic telemetry pill polling `/api/v1/health/live` and `/api/v1/health/ready` every 10s to display real-time backend and database latency.
- **`AccountPage.tsx`** ([`apps/web/src/pages/AccountPage.tsx`](file:///d:/My%20personal/algions/apps/web/src/pages/AccountPage.tsx)): Customer profile management, email verification prompt, style preference selection (Minimalist, Brutalist, Oversized), address book CRUD, and session logout.
- **`OrderTrackingPage.tsx`** ([`apps/web/src/pages/OrderTrackingPage.tsx`](file:///d:/My%20personal/algions/apps/web/src/pages/OrderTrackingPage.tsx)): Order lookup requiring customer email confirmation to prevent unauthorized order data enumeration.
- **`AdminDashboard.tsx`** ([`apps/web/src/pages/AdminDashboard.tsx`](file:///d:/My%20personal/algions/apps/web/src/pages/AdminDashboard.tsx)): Inventory controls, stock adjustments, order management, and live administrative audit event log inspection.

### Responsive Breakpoints & Viewport Engineering
The layout is tested across 4 viewports:
- **Mobile (`390px`)**: Single-column product grids, compact navigation with burger menu, full-width checkout and bottom sticky actions.
- **Tablet Portrait (`768px`)**: Two-column catalog grid, adaptive banner typography, drawer overlays.
- **Tablet Landscape / Small Laptop (`963px`)**: Dedicated responsive breakpoint ensuring hero images and bento grids maintain proportional aspect ratios without layout shift.
- **Desktop / Ultra-Wide (`1440px+`)**: Full brutalist 4-column catalog, asymmetric bento grid for "Shop by Form", side-by-side product detail views.

---

## 3. Backend Technology Stack

The backend service is located in [`apps/api`](file:///d:/My%20personal/algions/apps/api) and runs as a high-performance Express REST API written in TypeScript.

### Runtime Environment & Core Libraries
- **Node.js (`24 LTS` / Container: `node:22-alpine` / `node:20-alpine`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* High-throughput asynchronous event-driven JavaScript runtime.
- **Express.js (`4.21.2` / Resolved `4.22.3`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* HTTP routing, middleware chain execution, JSON body parsing, and route controllers.  
  *Key Evidence:* [`apps/api/package.json`](file:///d:/My%20personal/algions/apps/api/package.json#L24), [`apps/api/src/app.ts`](file:///d:/My%20personal/algions/apps/api/src/app.ts#L1-L150).
- **TypeScript (`5.7.3` / Resolved `5.9.3`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* Strict type checking across repositories, controllers, database models, and service interfaces. Compiled via `tsc` to `dist/`.

### Schema Validation & Serialization
- **Zod (`3.24.1` / Resolved `3.25.76`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* Schema validation middleware for incoming request bodies, route parameters, and query strings. Rejects malformed requests with RFC 7807 compliant 400 Bad Request responses before hitting database layers.  
  *Key Evidence:* [`apps/api/src/middleware/validate.ts`](file:///d:/My%20personal/algions/apps/api/src/middleware/validate.ts#L1-L35), [`apps/api/src/validators/schemas.ts`](file:///d:/My%20personal/algions/apps/api/src/validators/schemas.ts#L1-L120).

### Security, Cryptography & Authentication
- **`jsonwebtoken` (`9.0.2` / Resolved `9.0.3`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* Generates and verifies short-lived (15-minute) signed JWT customer access tokens containing `sub`, `email`, and `role`, as well as 8-hour admin tokens.  
  *Key Evidence:* [`apps/api/src/middleware/auth.ts`](file:///d:/My%20personal/algions/apps/api/src/middleware/auth.ts#L1-L75).
- **`bcryptjs` (`2.4.3`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* One-way password hashing using 10 salt rounds for customer accounts and administrative credentials.  
  *Key Evidence:* [`apps/api/src/services/customerAuthService.ts`](file:///d:/My%20personal/algions/apps/api/src/services/customerAuthService.ts#L30-L45).
- **`cookie-parser` (`1.4.7`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* Parses secure HTTP-only cookies storing long-lived refresh tokens (`algions_refresh_token`), shielding tokens from browser XSS extraction.  
  *Key Evidence:* [`apps/api/src/app.ts`](file:///d:/My%20personal/algions/apps/api/src/app.ts#L35).
- **UUID (`11.0.5` / Resolved `11.1.1`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* Generation of UUIDv4 primary keys, correlation IDs (`X-Correlation-ID`), order tracking numbers, and email verification tokens.  
  *Key Evidence:* [`apps/api/src/repositories/orderRepository.ts`](file:///d:/My%20personal/algions/apps/api/src/repositories/orderRepository.ts#L50).

### Email Service & Transactional Notifications
- **`nodemailer` (`10.5.0`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* Full-featured SMTP email delivery service with HTML escaping to prevent email injection attacks, brutalist HTML templates for verification and password reset, and a non-production preview gateway (`/dev/emails/:id`) when SMTP credentials are omitted.  
  *Key Evidence:* [`apps/api/src/services/emailService.ts`](file:///d:/My%20personal/algions/apps/api/src/services/emailService.ts#L1-L260).

### Structured Logging & Telemetry
- **`pino` (`9.6.0` / Resolved `9.14.0`) & `pino-http` (`10.4.0` / Resolved `10.5.0`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Purpose:* High-performance JSON structured logger emitting standardized log records with ISO timestamps, correlation IDs, execution durations, log levels, HTTP methods, client IPs, and sanitization filters preventing token/password leakage.  
  *Key Evidence:* [`apps/api/src/utils/logger.ts`](file:///d:/My%20personal/algions/apps/api/src/utils/logger.ts#L1-L60).

### Backend Request Lifecycle Architecture
```
Incoming HTTP Request
  │
  ▼
[pino-http Middleware] ─── Assigns X-Correlation-ID & logs arrival
  │
  ▼
[cors Middleware] ──────── Evaluates Allowed Origins (Domain Whitelist)
  │
  ▼
[cookie-parser] ────────── Extracts HTTP-Only Refresh Tokens & Session Cookies
  │
  ▼
[express.json()] ───────── Parses Request Body (Enforces payload byte limits)
  │
  ▼
[Zod Validator] ────────── Validates Params, Query & Body against strict schema
  │                        └─ Fails? Returns 400 Bad Request RFC 7807 Error
  ▼
[Auth Middleware] ──────── (If protected) Verifies JWT Bearer Token signature
  │                        └─ Invalid? Returns 401 Unauthorized
  ▼
[Controller] ───────────── Translates HTTP context into typed service input
  │
  ▼
[Service Layer] ────────── Executes business logic, transactions, password hashing
  │
  ▼
[Repository Layer] ─────── Executes parameterized SQL against pg Connection Pool
  │                        └─ Enforces pessimistic SELECT FOR UPDATE locks
  ▼
PostgreSQL 16 Engine ───── Returns rows or triggers immutability / foreign key constraints
  │
  ▼
[Service & Controller] ─── Formats response payload into standardized JSON
  │
  ▼
HTTP 200/201 Response ──── Sent with security headers (X-Content-Type-Options, etc.)
```

---

## 4. Database and Data Architecture

The persistence layer is powered by **PostgreSQL 16 Alpine** configured with least-privilege role segregation, connection pooling, pessimistic concurrency controls, and append-only cryptographic audit trails.

### Database Connection Pool
- **`pg` (`8.13.1` / Resolved `8.23.1`)**  
  *Status:* `IMPLEMENTED` | `VERIFIED`  
  *Configuration:* Managed via `pg.Pool` in [`apps/api/src/database/connection.ts`](file:///d:/My%20personal/algions/apps/api/src/database/connection.ts). Configured with `max: 20` clients, 30s idle timeout, 5s connection timeout, query duration logging, and automatic in-memory fallback during isolated test environments.

### Least-Privilege Role Separation Architecture
Defined in [`apps/api/src/database/roles.sql`](file:///d:/My%20personal/algions/apps/api/src/database/roles.sql):
1. **`algions_admin` (DDL & Migrations Role)**:  
   Owns all database tables, sequences, and extensions. Used exclusively during container migration runs (`node dist/database/migrate.js`). Denied interactive runtime web application access.
2. **`algions_app` (Runtime Application Role)**:  
   Used exclusively by `apps/api`. Granted strict DML permissions (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) on operational tables. **Explicitly revoked of all DDL privileges** (`CREATE`, `DROP`, `ALTER`). Prevented from executing `UPDATE` or `DELETE` on the `audit_events` table.
3. **`algions_backup` (Read-Only Operational Role)**:  
   Granted strictly `SELECT` permissions across all tables. Utilized exclusively by automated disaster recovery and backup scripts (`pg_dump`).

### Database Schema Inventory (29 Tables)
Full DDL defined in [`apps/api/src/database/schema.sql`](file:///d:/My%20personal/algions/apps/api/src/database/schema.sql):

| Table Name | Purpose | Primary Keys & Foreign Keys | Status |
| :--- | :--- | :--- | :--- |
| `products` | Core catalog garments, GSM, fabric, care specs | `id` (VARCHAR PK), `category_id` (FK) | **IMPLEMENTED & SEEDED** (24 Products) |
| `product_variants` | Size, color, SKU, and variant stock counts | `id` (VARCHAR PK), `product_id` (FK) | **IMPLEMENTED & SEEDED** (70 Variants) |
| `product_images` | Editorial imagery, aspect ratios, display order | `id` (VARCHAR PK), `product_id` (FK) | **IMPLEMENTED & SEEDED** (26 Images) |
| `categories` | Hierarchical taxonomy (Outerwear, Tailoring, etc.) | `id` (VARCHAR PK), `parent_id` (Self FK) | **IMPLEMENTED & SEEDED** (9 Categories) |
| `collections` | Seasonal lookbooks (Season 04, Atelier, Archive) | `id` (VARCHAR PK) | **IMPLEMENTED & SEEDED** (3 Collections) |
| `orders` | Customer orders, shipping, payment status, totals | `id` (UUID PK), `idempotency_key` (Unique) | **IMPLEMENTED & VERIFIED** |
| `order_items` | Snapshot of unit price, quantity, size at purchase | `id` (UUID PK), `order_id` (FK), `product_id` (FK) | **IMPLEMENTED & VERIFIED** |
| `idempotency_keys` | RFC 7395 replay prevention and cached responses | `key` (VARCHAR PK), `response_body` (JSONB) | **IMPLEMENTED & VERIFIED** |
| `admin_users` | Hash-authenticated store operators | `id` (UUID PK), `username` (Unique) | **IMPLEMENTED & VERIFIED** |
| `audit_events` | Append-only security and operational audit log | `id` (UUID PK), Immutability DB Trigger | **IMPLEMENTED & VERIFIED** |
| `users` | Registered customer identity, verification status | `id` (UUID PK), `email` (Unique) | **IMPLEMENTED & VERIFIED** |
| `user_sessions` | Refresh token hashes, device metadata, revocation | `id` (UUID PK), `user_id` (FK) | **IMPLEMENTED & VERIFIED** |
| `email_verification_tokens` | SHA-256 tokens for customer email confirmation | `id` (UUID PK), `user_id` (FK) | **IMPLEMENTED & VERIFIED** |
| `password_reset_tokens` | Single-use expiring password recovery tokens | `id` (UUID PK), `user_id` (FK) | **IMPLEMENTED & VERIFIED** |
| `customer_preferences` | Style, fit, size, and marketing preferences | `user_id` (PK, FK to `users`) | **IMPLEMENTED & VERIFIED** |
| `customer_addresses` | Saved billing and shipping address book | `id` (UUID PK), `user_id` (FK) | **IMPLEMENTED & VERIFIED** |
| `carts` | Server-side cart persistence across devices | `id` (UUID PK), `user_id` (FK) | **CONFIGURED IN SCHEMA** |
| `cart_items` | Items associated with server-side carts | `id` (UUID PK), `cart_id` (FK), `product_id` (FK) | **CONFIGURED IN SCHEMA** |
| `wishlists` | Customer curated product saves | `id` (UUID PK), `user_id` (FK) | **CONFIGURED IN SCHEMA** |
| `wishlist_items` | Product items in user wishlists | `id` (UUID PK), `wishlist_id` (FK) | **CONFIGURED IN SCHEMA** |
| `coupons` | Promo codes, discount types, validity windows | `id` (UUID PK), `code` (Unique) | **CONFIGURED IN SCHEMA** |
| `coupon_redemptions` | Usage tracking per customer | `id` (UUID PK), `coupon_id` (FK), `user_id` (FK) | **CONFIGURED IN SCHEMA** |
| `payments` | Transaction references, gateway IDs, payment state | `id` (UUID PK), `order_id` (FK) | **CONFIGURED IN SCHEMA** |
| `shipments` | Carrier tracking codes, dispatch dates, status | `id` (UUID PK), `order_id` (FK) | **CONFIGURED IN SCHEMA** |
| `shipment_events` | Real-time carrier transit milestones | `id` (UUID PK), `shipment_id` (FK) | **CONFIGURED IN SCHEMA** |
| `returns` | Return authorizations, return reason, status | `id` (UUID PK), `order_id` (FK) | **CONFIGURED IN SCHEMA** |
| `refunds` | Refund disbursement records, gateway references | `id` (UUID PK), `return_id` (FK) | **CONFIGURED IN SCHEMA** |
| `reviews` | Customer ratings, verified purchase reviews | `id` (UUID PK), `product_id` (FK), `user_id` (FK) | **CONFIGURED IN SCHEMA** |
| `notifications` | In-app customer alerts and messaging | `id` (UUID PK), `user_id` (FK) | **CONFIGURED IN SCHEMA** |

### Concurrency Handling & Pessimistic Row-Level Locking
To prevent inventory overselling during concurrent checkout spikes, [`apps/api/src/repositories/orderRepository.ts`](file:///d:/My%20personal/algions/apps/api/src/repositories/orderRepository.ts) executes inside a PostgreSQL `BEGIN ... COMMIT` transaction. Stock verification utilizes:
```sql
SELECT id, stock FROM products WHERE id = $1 FOR UPDATE;
```
This acquires an exclusive row-level lock on the product or variant, serializing concurrent requests and rejecting checkout attempts if stock decrements below zero.

### Idempotency Architecture
Every checkout request accepts an `Idempotency-Key` HTTP header. Before processing an order:
1. The API checks `idempotency_keys` table for existing key.
2. If found, it immediately returns the cached JSON status and body without re-decrementing inventory or re-charging payments.
3. If new, it executes the order transaction and atomically writes the resulting response into `idempotency_keys`.

---

## 5. DevOps and Containerization

The production environment is packaged into a multi-container Docker architecture defined across [`docker-compose.yml`](file:///d:/My%20personal/algions/docker-compose.yml) and [`docker-compose.prod.yml`](file:///d:/My%20personal/algions/docker-compose.prod.yml).

### Container Orchestration Topology
The local and production environments operate 5 interconnected containers on an isolated bridge network (`internal_network` / `algions-internal-bridge`):

```
       Internet / Client Browser
                 │
                 ▼  Port 80 (HTTP) -> 301 Redirect
                 ▼  Port 443 (HTTPS)
      ┌─────────────────────────────┐
      │   algions-nginx (Proxy)     │
      │   Nginx 1.27-alpine         │
      │   - Serves React SPA static │
      │   - Proxies /api/ to API    │
      └──────────────┬──────────────┘
                     │ Internal Docker Network (internal_network)
                     ▼
      ┌─────────────────────────────┐
      │   algions-api (Node.js)     │
      │   Express 4 + TypeScript    │
      │   Port: 4000 (Internal)     │
      └──────────────┬──────────────┘
                     │
                     ▼ Internal Port 5432 (No public port exposure)
      ┌─────────────────────────────┐
      │   algions-postgres (DB)     │
      │   PostgreSQL 16 Alpine      │
      │   Volume: postgres_data     │
      └─────────────────────────────┘
                     ▲
                     │ Scrapes :4000/api/v1/metrics
      ┌──────────────┴──────────────┐
      │  algions-prometheus         │
      │  Prometheus v3.13.5         │
      └──────────────┬──────────────┘
                     │ Port 9090 internal
                     ▼
      ┌─────────────────────────────┐
      │  algions-grafana (Admin)    │
      │  Grafana 13.3.0             │
      │  Port 127.0.0.1:3001:3000   │
      └─────────────────────────────┘
```

### Multi-Stage Dockerfile Engineering
1. **API Dockerfile (`apps/api/Dockerfile`)**:
   - *Stage 1 (Builder)*: Base `node:22-alpine`, installs workspace dependencies with `npm ci`, compiles TypeScript via `tsc`.
   - *Stage 2 (Runtime)*: Minimal `node:22-alpine`, non-root user `node` (UID 1000), copies only production `node_modules` and compiled `dist/`, executes with `security_opt: [no-new-privileges:true]` and `cap_drop: [ALL]`.
2. **Web Dockerfile (`apps/web/Dockerfile`)**:
   - *Stage 1 (Builder)*: Base `node:22-alpine`, executes `npm run build --workspace=@algions/web` generating static bundles in `dist/`.
   - *Stage 2 (Runtime)*: Minimal `nginx:1.27-alpine`, copies static assets to `/usr/share/nginx/html`, mounts custom TLS certificates and Nginx configuration.

### Nginx Reverse Proxy & TLS Configuration
Defined in [`infra/nginx/nginx.conf`](file:///d:/My%20personal/algions/infra/nginx/nginx.conf) and [`infra/nginx/default.conf`](file:///d:/My%20personal/algions/infra/nginx/default.conf):
- Enforces HTTP to HTTPS redirection (`return 301 https://$host$request_uri;`).
- TLS termination using modern TLSv1.2 and TLSv1.3 ciphers (`ECDHE-ECDSA-AES128-GCM-SHA256:...`).
- HTTP/2 support enabled.
- Gzip and Brotli static asset compression.
- Upstream proxy pass for `/api/` traffic to `http://api:4000/api/` with preserved headers (`X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, `Host`).
- Strict security headers (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`).

---

## 6. CI/CD and GitHub Actions

Automated pipelines are codified in three dedicated workflows in [`.github/workflows`](file:///d:/My%20personal/algions/.github/workflows):

### 1. Verification & Quality Gate (`ci.yml`)
Runs on all pull requests and pushes to `main`. Executes 21 automated steps:
1. Secret Leak Detection via `gitleaks/gitleaks-action@v2`.
2. Node.js environment setup (`actions/setup-node@v4`) with npm dependency caching.
3. Clean dependency installation with strict lockfile verification (`npm ci`).
4. Monorepo TypeScript type compilation (`npm run typecheck`).
5. Monorepo static code analysis (`npm run lint`).
6. Ephemeral PostgreSQL 16 container provisioning for integration testing.
7. Database schema migration & role assignment execution.
8. Catalog database seed verification (24 products, 70 variants, 26 images).
9. Vitest comprehensive test suite execution (12 test suites, 100 tests).
10. Playwright browser engine installation (`npx playwright install --with-deps chromium`).
11. End-to-end acceptance suite execution (8 multi-step customer journey scenarios).
12. Multi-stage Docker image builds (`algions-api:test`, `algions-web:test`).
13. Container image security audit via `aquasecurity/trivy-action` (Fails build on CRITICAL vulnerabilities).
14. Artifact upload for test reports and visual screenshot evidence.

### 2. Multi-Architecture Image Release (`release.yml`)
Triggered on Git release tags (`v*.*.*`):
- Initializes QEMU emulation and Docker Buildx.
- Authenticates with GitHub Container Registry (`ghcr.io`).
- Builds and publishes multi-architecture images (`linux/amd64`, `linux/arm64`):
  - `ghcr.io/areeb8792/alg-ecom/api:v1.0.4`
  - `ghcr.io/areeb8792/alg-ecom/web:v1.0.4`
- Attaches release metadata and changelogs.

### 3. Production Deployment (`deploy.yml`)
*Status:* `CONFIGURED IN CODE`  
- Defines automated SSH/SSM deployment steps to pull published GHCR containers onto target cloud instances and execute zero-downtime rolling restarts.

---

## 7. Cloud Infrastructure and Infrastructure as Code

Cloud infrastructure is codified via Terraform and Ansible in [`infra/`](file:///d:/My%20personal/algions/infra).

### Terraform Infrastructure as Code (`infra/terraform/`)
- **Terraform Core (`>= 1.10.0`)** with AWS Provider (`~> 5.0` / Resolved `5.100.0` in `.terraform.lock.hcl`).
- **AWS Resources Declared in [`main.tf`](file:///d:/My%20personal/algions/infra/terraform/main.tf)**:
  - `aws_instance.app_server`: EC2 `t3.medium` running Amazon Linux 2023 with 30GB gp3 root volume.
  - `aws_security_group.app_sg`: Ingress restricted exclusively to TCP `80` (HTTP) and `443` (HTTPS). **SSH Port 22 is explicitly removed** to enforce zero-trust management.
  - `aws_iam_role.ec2_ssm_role` & `aws_iam_instance_profile.ec2_ssm_profile`: AWS Systems Manager (SSM) Session Manager configuration allowing encrypted shell access without open inbound ports.
  - `aws_s3_bucket.db_backups`: Encrypted S3 bucket with default `AES256` Server-Side Encryption (SSE-S3), bucket versioning enabled, and automated 30-day lifecycle expiration rules for database dumps.
  - `backend.tf`: S3 remote state storage configuration with native S3 state locking (`use_lockfile = true`).

### Ansible Configuration Management (`infra/ansible/playbook.yml`)
- Automates host hardening and directory initialization:
  - Installs runtime dependencies: `curl`, `git`, `openssl`, `ca-certificates`, `docker`.
  - Creates isolated system user and group `algions` added to `docker` group.
  - Establishes root application directory `/opt/algions` with `0755` permissions.
  - Enforces strict least-privilege `0600` file permissions on `/opt/algions/.env`.
  - Enables and starts the Docker daemon.

> [!IMPORTANT]
> **Operational Status Distinction**:
> - **In-Code Definition & Verification**: Terraform configurations are syntactically validated (`terraform init` and `.terraform.lock.hcl` locked). Ansible playbooks are defined and syntactically verified.
> - **Live Cloud Deployment**: As of the `v1.0.4` release baseline, the cloud resources are **CONFIGURED & VALIDATED IN CODE**, but are **NOT** actively running or provisioned on an external live AWS account. All acceptance testing is currently verified using production-identical local Docker Compose environments.

---

## 8. Monitoring, Observability and Logging

The monitoring stack delivers continuous insight into application health, database connectivity, and HTTP traffic metrics.

### Prometheus Metrics Collection (`infra/prometheus/`)
- **Prometheus (`v3.13.5`)**:
  - Scrapes the API metrics endpoint every 15 seconds: `http://api:4000/api/v1/metrics`.
  - Retention period configured to 15 days (`--storage.tsdb.retention.time=15d`).
  - Exports standard HTTP server metrics: request rates, status code distribution (2xx, 4xx, 5xx), response duration histograms, process memory RSS, event loop lag, and active database connection pool counts.

### Grafana Visualization Dashboards (`infra/grafana/`)
- **Grafana (`13.3.0`)**:
  - Bound strictly to localhost loopback interface `127.0.0.1:3001` to prevent unauthorized public internet inspection.
  - Auto-provisions Prometheus datasource via [`infra/grafana/provisioning/datasources/prometheus.yml`](file:///d:/My%20personal/algions/infra/grafana/provisioning/datasources/prometheus.yml).
  - Pre-loads dedicated dashboard [`infra/grafana/dashboards/algions_overview.json`](file:///d:/My%20personal/algions/infra/grafana/dashboards/algions_overview.json) displaying real-time graphs:
    - HTTP Request Rate & Latency (p95, p99).
    - HTTP Status Error Rates (4xx Client / 5xx Server).
    - Database Connection Pool Saturation & Query Latencies.
    - System CPU, Memory, and Node.js Event Loop Delay.

### Health Endpoints & Telemetry
1. **Liveness Probe (`/api/v1/health/live`)**: Instant shallow check confirming the Node.js event loop is responsive.
2. **Readiness Probe (`/api/v1/health/ready`)**: Deep diagnostic probe executing a live SQL ping (`SELECT 1`) against the PostgreSQL connection pool. Returns `status: "ok"` and latency in milliseconds.

---

## 9. Application Security Architecture

The application enforces defense-in-depth across every architectural boundary:

1. **Defense Against Secret Leaks**: Automated pre-commit and CI scanning via Gitleaks blocks tokens or private keys from entering the repository history.
2. **Container Security**: Container processes run with `no-new-privileges:true` and drop all Linux capabilities (`cap_drop: [ALL]`).
3. **Database Privilege Separation**: The runtime API connects as `algions_app` with zero DDL permissions and update/delete blocks on audit tables.
4. **Append-Only Security Audit Trail**: The `audit_events` table enforces an internal PostgreSQL database trigger (`trigger_protect_audit_events_immutability`) that rejects any `UPDATE` or `DELETE` statement, even from administrative database roles.
5. **Session Security & Refresh Token Rotation**:
   - Access tokens are short-lived (15 minutes).
   - Long-lived refresh tokens are stored as SHA-256 cryptographic hashes in `user_sessions`.
   - On refresh, the token is invalidated, a new token is issued, and if a revoked token is ever presented (token reuse / replay attack), **all active sessions for that user are immediately purged and revoked**.
6. **Input Sanitization & Injection Prevention**: All SQL interactions use parameterized `$1, $2` inputs via the `pg` client. All request bodies are strictly sanitized via Zod schemas. Email templates escape HTML characters to block email HTML injection.

---

## 10. Testing and Quality Assurance

The codebase maintains automated test coverage across unit, integration, concurrency, and end-to-end browser dimensions.

### Test Suites Inventory (100 Vitest Tests across 12 Suites)
Executed via `npm test` (`vitest run`):
1. [`apps/api/tests/auth.test.ts`](file:///d:/My%20personal/algions/apps/api/tests/auth.test.ts): Admin JWT creation, invalid signature rejection, expired token handling (3 tests).
2. [`apps/api/tests/customer_identity.test.ts`](file:///d:/My%20personal/algions/apps/api/tests/customer_identity.test.ts): Customer registration, verification tokens, password hashing, session revocation, address CRUD (27 tests).
3. [`apps/api/tests/catalog_variants.test.ts`](file:///d:/My%20personal/algions/apps/api/tests/catalog_variants.test.ts): Multi-variant SKU querying, category hierarchy, stock level validation (7 tests).
4. [`apps/api/tests/concurrency_inventory.test.ts`](file:///d:/My%20personal/algions/apps/api/tests/concurrency_inventory.test.ts): High-frequency race conditions and pessimistic lock validation (1 test).
5. [`apps/api/tests/database_security.test.ts`](file:///d:/My%20personal/algions/apps/api/tests/database_security.test.ts): Least-privilege role boundaries, DDL denial, audit immutability trigger (11 tests).
6. [`apps/api/tests/database_outage.test.ts`](file:///d:/My%20personal/algions/apps/api/tests/database_outage.test.ts): In-memory catalog resilience during PostgreSQL connection loss (4 tests).
7. [`apps/api/tests/email_service.test.ts`](file:///d:/My%20personal/algions/apps/api/tests/email_service.test.ts): SMTP dispatch, mock previews, HTML sanitization, status tracking (10 tests).
8. [`apps/api/tests/health.test.ts`](file:///d:/My%20personal/algions/apps/api/tests/health.test.ts): `/live` and `/ready` telemetry diagnostic probes (4 tests).
9. [`apps/api/tests/idempotency_order.test.ts`](file:///d:/My%20personal/algions/apps/api/tests/idempotency_order.test.ts): Network retry duplicate order suppression (8 tests).
10. [`apps/api/tests/order_auth_security.test.ts`](file:///d:/My%20personal/algions/apps/api/tests/order_auth_security.test.ts): Order tracking privacy and email match verification (11 tests).
11. [`apps/api/tests/security_governance.test.ts`](file:///d:/My%20personal/algions/apps/api/tests/security_governance.test.ts): Admin role guards, CORS header compliance, XSS defenses (7 tests).
12. [`apps/api/tests/validators.test.ts`](file:///d:/My%20personal/algions/apps/api/tests/validators.test.ts): Zod schema boundaries and RFC 7807 error responses (7 tests).

### End-to-End Acceptance Tests (8 Playwright Scenarios)
Executed via `npx playwright test` ([`e2e/storefront.spec.ts`](file:///d:/My%20personal/algions/e2e/storefront.spec.ts)):
- **01: Homepage & Editorial Hero Presentation**: Validates typography, branding, dynamic hero image loading.
- **02: Collections Navigation & Archive Filtering**: Filters catalog by category pills (`OUTERWEAR`, `TAILORING`, etc.).
- **03: Dedicated Product Detail Page**: Validates variant size pickers, fabric GSM metadata, live stock counter.
- **04: Shopping Bag Interactions**: Validates add-to-bag, quantity modification, and `localStorage` persistence.
- **05: Customer Checkout Workflow**: Validates form inputs, billing details, and security badges.
- **06: Real Order Creation & Price Snapshot**: Submits checkout, creates PostgreSQL order, validates UUID tracking.
- **07: Privacy-Protected Order Tracking**: Validates tracking lookup requiring matching customer email.
- **08: Administrative Operations & Audit Trail**: Admin login, inventory stock adjustment, and verification of audit event logs.

---

## 11. E-Commerce Functional Architecture

| Functional Area | Frontend Implementation | Backend Implementation | Database Persistence | External Integration | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Customer Registration & Auth** | `AccountPage.tsx`, `AuthContext.tsx` | `customerAuthController.ts`, `customerAuthService.ts` | `users`, `user_sessions` | Nodemailer SMTP | **IMPLEMENTED & VERIFIED** |
| **Email Verification** | `AccountPage.tsx`, verification banner | `customerAuthController.ts`, `emailService.ts` | `email_verification_tokens` | SMTP / Dev Gateway | **IMPLEMENTED & VERIFIED** |
| **Password Reset** | `AccountPage.tsx` reset cipher flow | `customerAuthController.ts`, `emailService.ts` | `password_reset_tokens` | SMTP / Dev Gateway | **IMPLEMENTED & VERIFIED** |
| **Customer Preferences** | `AccountPage.tsx` fit & style preferences | `customerUserController.ts`, `customerUserRepository.ts` | `customer_preferences` | None | **IMPLEMENTED & VERIFIED** |
| **Address Book Management** | `AccountPage.tsx` shipping addresses | `customerUserController.ts`, `customerUserRepository.ts` | `customer_addresses` | None | **IMPLEMENTED & VERIFIED** |
| **Product Catalog & Archive** | `CatalogPage.tsx`, `ProductCard.tsx` | `productController.ts`, `productRepository.ts` | `products`, `categories`, `collections` | Unsplash CDN | **IMPLEMENTED & VERIFIED** |
| **Variant Selection (Size/Color)** | `ProductDetailPage.tsx` | `productController.ts` | `product_variants` | None | **IMPLEMENTED & VERIFIED** |
| **Editorial Imagery & Lookbooks** | `ProductDetailPage.tsx`, Hero banners | `productController.ts` | `product_images` | Unsplash CDN | **IMPLEMENTED & VERIFIED** |
| **Shopping Bag & Local Sync** | `CartDrawer.tsx`, `CartContext.tsx` | LocalStorage + memory state | Browser LocalStorage | None | **IMPLEMENTED & VERIFIED** |
| **Checkout & Order Creation** | `CheckoutPage.tsx` | `orderController.ts`, `orderRepository.ts` | `orders`, `order_items` | None | **IMPLEMENTED & VERIFIED** |
| **Pessimistic Inventory Locking**| Stock alert badges | `orderRepository.ts` (`SELECT FOR UPDATE`) | `products.stock` | None | **IMPLEMENTED & VERIFIED** |
| **Idempotent Checkout Replay** | Browser UUID request header | `orderController.ts`, `orderRepository.ts` | `idempotency_keys` | None | **IMPLEMENTED & VERIFIED** |
| **Order Tracking & Verification** | `OrderTrackingPage.tsx` | `orderController.ts` | `orders`, `order_items` | None | **IMPLEMENTED & VERIFIED** |
| **Admin Dashboard & Stock Control**| `AdminDashboard.tsx` | `adminController.ts`, `orderRepository.ts` | `products`, `audit_events` | None | **IMPLEMENTED & VERIFIED** |
| **Payment Gateway Integration** | Mock card UI / security badges | Payment transaction schema | `payments` | Planned (Stripe) | **PARTIAL (Schema Ready)** |
| **Shipments & Courier Tracking** | Order status display | Carrier tracking schema | `shipments`, `shipment_events` | Planned (ShipStation) | **PARTIAL (Schema Ready)** |
| **Returns & Exchanges** | Policy text & account history | Returns schema | `returns`, `refunds` | None | **PARTIAL (Schema Ready)** |
| **Customer Product Reviews** | Static review badges | Product reviews schema | `reviews` | None | **PARTIAL (Schema Ready)** |
| **Wishlist Persistent Sync** | Local save interaction | Wishlist persistence schema | `wishlists`, `wishlist_items` | None | **PARTIAL (Schema Ready)** |

---

## 12. External Services and Integrations

| External Service | Technical Purpose | Configuration Location | Status | Credentials Required |
| :--- | :--- | :--- | :--- | :--- |
| **SMTP Mail Server** | Transactional email delivery (Verification, Reset) | `apps/api/.env`, `SMTP_HOST`, `SMTP_PORT` | **CONFIGURED & TESTED** | `SMTP_USER`, `SMTP_PASS` |
| **Unsplash Editorial CDN** | High-resolution brutalist garment photography | `apps/api/src/database/seed.ts` | **ACTIVELY CONNECTED** | None (Public HTTPS CDN) |
| **GitHub Actions** | Automated CI verification and gating | `.github/workflows/ci.yml` | **ACTIVELY RUNNING** | `GITHUB_TOKEN` |
| **GitHub Container Registry**| Multi-arch container image storage (`ghcr.io`) | `.github/workflows/release.yml` | **CONFIGURED & PUBLISHED**| `GITHUB_TOKEN` |
| **AWS Cloud Services** | EC2, S3, IAM, SSM, CloudWatch | `infra/terraform/main.tf` | **CONFIGURED IN CODE** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| **Payment Gateway** | Credit card processing & webhook events | `schema.sql` (`payments` table) | **PLANNED** | API Keys (e.g. Stripe) |

---

## 13. Complete System Architecture & Diagrams

### Runtime System Architecture
```mermaid
flowchart TD
    subgraph Client["Client Tier (User Browser)"]
        Browser["Customer Browser"]
        SPA["React 18 / Vite SPA\n(apps/web)"]
        Browser -->|Interacts| SPA
    end

    subgraph Edge["Edge / Reverse Proxy Tier"]
        Nginx["Nginx 1.27 Reverse Proxy\n(Ports 80 -> 443 TLS)"]
        SPA -->|Static Assets & API Requests| Nginx
    end

    subgraph AppTier["Application Tier (apps/api)"]
        Express["Express 4.21 REST API\n(Port 4000)"]
        Pino["Pino Structured Logging\n& Correlation IDs"]
        Zod["Zod Validation Middleware"]
        Auth["JWT & Cookie Authentication"]
        Service["Service Layer\n(CustomerAuth, Order, Catalog)"]
        Email["Nodemailer Email Service"]
        
        Nginx -->|Proxy Pass /api/*| Express
        Express --> Pino
        Express --> Zod
        Zod --> Auth
        Auth --> Service
        Service --> Email
    end

    subgraph DataTier["Data Tier (Docker Network)"]
        PG["PostgreSQL 16 Alpine\n(algions-postgres:5432)"]
        Pool["pg.Pool Connection Pool\n(Runtime Role: algions_app)"]
        Audit["Append-Only audit_events\n(Immutability Trigger)"]
        Pessimistic["Row-Level Locks\n(SELECT FOR UPDATE)"]
        
        Service --> Pool
        Pool --> PG
        PG --- Audit
        PG --- Pessimistic
    end

    subgraph OpsTier["Observability Tier"]
        Prom["Prometheus v3.13.5\n(Scrapes :4000/api/v1/metrics)"]
        Graf["Grafana 13.3.0\n(Port 127.0.0.1:3001)"]
        
        Prom -->|Scrape| Express
        Graf -->|Query| Prom
    end

    subgraph ExtTier["External Infrastructure"]
        SMTP["SMTP Mail Provider\n(Verification & Password Reset)"]
        CDN["Unsplash Editorial CDN\n(Garment Images)"]
        
        Email -.->|Dispatches| SMTP
        Browser -.->|Fetches Images| CDN
    end
```

### Continuous Integration & Delivery Pipeline
```mermaid
flowchart LR
    Dev["Developer Git Push\n(Commit / Tag)"] --> SecretScan["1. Gitleaks Secret Scan"]
    SecretScan --> Install["2. npm ci (Lockfile Strict)"]
    Install --> Typecheck["3. tsc --noEmit (Typecheck)"]
    Typecheck --> Lint["4. eslint (Static Analysis)"]
    
    subgraph TestEnv["Ephemeral Database Testing"]
        Lint --> PGTest["5. Spin up PostgreSQL 16"]
        PGTest --> Migrate["6. Migrate DDL & Roles"]
        Migrate --> SeedTest["7. Seed 24 Catalog Products"]
        SeedTest --> Vitest["8. Vitest (100 Tests)"]
        Vitest --> Playwright["9. Playwright (8 E2E Scenarios)"]
    end
    
    subgraph BuildScan["Containerization & Security"]
        Playwright --> Buildx["10. Docker Multi-Stage Build"]
        Buildx --> Trivy["11. Trivy Vulnerability Scan"]
    end

    subgraph ReleaseStage["Release & Registry"]
        Trivy --> ReleaseCheck{"Git Tag v*.*.*?"}
        ReleaseCheck -- Yes --> GHCR["12. Buildx Multi-Arch Push\n(ghcr.io/areeb8792/alg-ecom)"]
        ReleaseCheck -- No --> Finish["PR Validated & Merged"]
    end
```

---

## 14. Developer Environment and Commands

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` / `v24.x LTS`
- **npm**: `v10.x+`
- **Docker Engine & Docker Compose**: `v26.x+` / Compose `v2.x+`

### Operational Command Runbook

#### 1. Repository Installation
```bash
# Clone the repository
git clone https://github.com/Areeb8792/Alg-eCom.git
cd Alg-eCom

# Strict lockfile dependency installation across all workspaces
npm ci
```

#### 2. Local Development Execution
```bash
# Start Vite Hot-Reloading Web Storefront (Port 3000)
npm run dev:web

# Start Express Development API (Port 4000)
npm run dev:api

# Start both frontend and backend concurrently
npm run dev
```

#### 3. Database Migration & Seed
```bash
# Execute DDL migrations as algions_admin
npm run db:migrate --workspace=@algions/api

# Seed catalog categories, collections, products, variants, and images
npm run db:seed --workspace=@algions/api
```

#### 4. Code Quality & Automated Tests
```bash
# Execute TypeScript compilation checks
npm run typecheck

# Execute ESLint static analysis
npm run lint

# Execute all 12 Vitest unit and integration suites (100 tests)
npm test

# Execute Playwright End-to-End Acceptance Suite
npx playwright test
```

#### 5. Production Docker Compose Stack
```bash
# Launch the complete 5-container production stack
docker compose up -d

# Verify all container healthcheck statuses
docker compose ps

# View real-time aggregated logs
docker compose logs -f

# Gracefully terminate container stack and networks
docker compose down
```

### Access Endpoints & Network Ports
- **Production Storefront (Nginx HTTPS)**: `https://localhost/`
- **Production Storefront (Nginx HTTP)**: `http://localhost/` (Auto-redirects to HTTPS)
- **Development Storefront (Vite HMR)**: `http://localhost:3000/`
- **Backend API Direct**: `http://localhost:4000/api/v1`
- **Prometheus UI**: `http://localhost:9090`
- **Grafana Dashboard UI**: `http://127.0.0.1:3001` (Restricted to loopback)

### Sanitized `.env.example` Inventory
```ini
# Node Environment Configuration
NODE_ENV=development
PORT=4000
HOST=0.0.0.0
LOG_LEVEL=info

# Database Connection (Least Privilege algions_app for Runtime)
DATABASE_URL=postgresql://algions_app:your_app_password_here@localhost:5432/algions_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=algions_db
DB_APP_USER=algions_app
DB_APP_PASSWORD=your_app_password_here

# Administrative / Migration Database Credentials (algions_admin)
DB_MIGRATION_USER=algions_admin
DB_MIGRATION_PASSWORD=your_admin_password_here

# Security Secrets
JWT_SECRET=your_minimum_32_character_cryptographic_jwt_secret_here
ADMIN_USERNAME=admin@algions.com
ADMIN_PASSWORD=your_secure_admin_password_here
COOKIE_SECRET=your_secure_cookie_signing_secret_here

# CORS Domain Whitelist
CORS_ORIGIN=http://localhost:3000,http://localhost:80,https://localhost,https://algions.com

# SMTP Transactional Email Configuration
SMTP_HOST=smtp.mailprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey_or_username
SMTP_PASS=your_smtp_secret_password
EMAIL_FROM="HEAVYWEIGHT // Algions" <orders@algions.com>

# Monitoring
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your_secure_grafana_password_here
```

---

## 15. Technology Stack Master Table

| Domain | Technology | Version | Purpose | Actual Usage | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend** | React | `18.3.1` | Core UI Component Framework | Declarative component tree, hooks, contexts | **IMPLEMENTED** |
| **Frontend** | React DOM | `18.3.1` | DOM Renderer for React | Browser DOM mounting and concurrent rendering | **IMPLEMENTED** |
| **Frontend** | TypeScript | `5.7.3` (Resolved `5.9.3`) | Static Type System | Monorepo strict typing and interface contracts | **IMPLEMENTED** |
| **Frontend** | Vite | `6.0.7` (Resolved `6.4.6`) | Build Tool & Dev Server | Fast ESM HMR and Rollup production bundling | **IMPLEMENTED** |
| **Frontend** | React Router DOM | `7.18.5` | Client-Side SPA Routing | Page routing, navigation, route protection | **IMPLEMENTED** |
| **Frontend** | Tailwind CSS | `3.4.17` (Resolved `3.4.19`) | Utility-First CSS Engine | Brutalist styling tokens, layouts, responsive grids | **IMPLEMENTED** |
| **Frontend** | Lucide React | `0.473.0` | SVG Icon Library | Navigation, status badges, action icons | **IMPLEMENTED** |
| **Frontend** | clsx & tailwind-merge| `2.1.1` & `2.6.0` | Classname Composition | Dynamic class merging in `cn()` utility | **IMPLEMENTED** |
| **Backend** | Node.js | `24 LTS` / `22-alpine` | Runtime Environment | High-throughput asynchronous server execution | **IMPLEMENTED** |
| **Backend** | Express.js | `4.21.2` (Resolved `4.22.3`) | Web Framework | REST API routing, controllers, middleware | **IMPLEMENTED** |
| **Backend** | Zod | `3.24.1` (Resolved `3.25.76`)| Schema Validation | Request parameter and body input validation | **IMPLEMENTED** |
| **Backend** | jsonwebtoken | `9.0.2` (Resolved `9.0.3`) | Token Authentication | Signed JWT access tokens (15m expiration) | **IMPLEMENTED** |
| **Backend** | bcryptjs | `2.4.3` | Cryptographic Password Hash| One-way hashing (10 salt rounds) | **IMPLEMENTED** |
| **Backend** | cookie-parser | `1.4.7` | Cookie Parsing | HTTP-only refresh token cookie extraction | **IMPLEMENTED** |
| **Backend** | nodemailer | `10.5.0` | SMTP Mail Dispatcher | Transactional email delivery and preview gate | **IMPLEMENTED** |
| **Backend** | pino & pino-http | `9.6.0` & `10.4.0` | Structured JSON Logger | RFC 5424 structured logging & correlation IDs | **IMPLEMENTED** |
| **Backend** | uuid | `11.0.5` (Resolved `11.1.1`)| Identifier Generator | UUIDv4 primary keys and correlation IDs | **IMPLEMENTED** |
| **Database** | PostgreSQL | `16 Alpine` | Relational Persistence | ACID transactions, row locking, audit triggers | **IMPLEMENTED** |
| **Database** | pg (node-postgres) | `8.13.1` (Resolved `8.23.1`)| PostgreSQL Client | Connection pooling, parameterized queries | **IMPLEMENTED** |
| **DevOps** | Docker Engine | `26.x+` | Container Virtualization | Microservice container isolation | **IMPLEMENTED** |
| **DevOps** | Docker Compose | `2.x+` | Multi-Container Orchestration| 5-service local and production stack | **IMPLEMENTED** |
| **DevOps** | Nginx | `1.27-alpine` | Reverse Proxy & Web Server | TLS termination, Brotli compression, routing | **IMPLEMENTED** |
| **DevOps** | Docker Buildx & QEMU| GitHub Actions Built-in | Multi-Arch Image Builder | Multi-platform compilation (`amd64`, `arm64`) | **CONFIGURED** |
| **DevOps** | GitHub Container Reg| `ghcr.io` | Container Image Registry | Base image hosting (`api:v1.0.4`, `web:v1.0.4`) | **CONFIGURED & PUBLISHED** |
| **CI/CD** | GitHub Actions | Workflows v4 | Pipeline Automation | 21-step CI verification, tests, and build | **VERIFIED** |
| **CI/CD** | Gitleaks | `v2` Action | Secret Scanner | Pre-commit and CI git history secret leak detection | **VERIFIED** |
| **CI/CD** | Trivy | Latest Aqua Security | Vulnerability Scanner | Container CVE and vulnerability scanning | **VERIFIED** |
| **IaC / Cloud**| Terraform | `>= 1.10.0` (AWS `5.100.0`)| Infrastructure as Code | EC2, SSM, S3, Security Groups, IAM | **CONFIGURED IN CODE** |
| **IaC / Cloud**| Ansible | Playbook Core | Configuration Management | Linux host hardening, users, permissions | **CONFIGURED IN CODE** |
| **Monitoring** | Prometheus | `v3.13.5` | Metrics Time-Series DB | Scrapes `/api/v1/metrics` every 15s | **IMPLEMENTED** |
| **Monitoring** | Grafana | `13.3.0` | Observability Dashboard | Real-time HTTP, DB, and system telemetry | **IMPLEMENTED** |
| **Testing** | Vitest | `3.0.4` (Resolved `3.2.7`) | Unit / Integration Test Engine| 12 test suites, 100 passing automated tests | **VERIFIED** |
| **Testing** | Supertest | `7.0.0` (Resolved `7.3.2`) | HTTP Integration Assertions | API endpoint assertions and mock responses | **VERIFIED** |
| **Testing** | Playwright | `1.65.0` | Browser E2E Acceptance | 8 real customer journey browser scenarios | **VERIFIED** |
| **Testing** | ESLint | `9.18.0` (Resolved `9.39.5`)| Static Code Linter | TypeScript linting and code quality gating | **VERIFIED** |

---

## 16. Technology Choices & Architectural Rationale

### Why This Stack Was Selected for HEAVYWEIGHT Season 04
1. **React 18 + Vite over Heavy SSR Frameworks**:  
   The Season 04 storefront prioritizes high-fidelity editorial aesthetics, interactive brutalist animations, real-time variant selections, and instant client-side cart interactions. A Vite-compiled React SPA avoids server-rendering overhead and cold starts while allowing the entire static bundle to be served by Nginx at edge speeds with Brotli compression.
2. **PostgreSQL 16 with Pessimistic Locking over NoSQL / Redis**:  
   Fashion drops feature high concurrency on limited inventory (e.g. 10 jackets in size Large). Relational ACID guarantees with `SELECT FOR UPDATE` prevent phantom reads, race conditions, and overselling without requiring complex distributed locks.
3. **TypeScript Monorepo with npm Workspaces**:  
   Eliminates type drift between backend models and frontend client contracts. Interfaces for products, orders, and authentication tokens are shared and compiled cleanly without external package publishing overhead.
4. **Least-Privilege Database Separation**:  
   Granting separate credentials to `algions_admin` (DDL migration), `algions_app` (runtime DML), and `algions_backup` (read-only backup) guarantees that even a remote code execution vulnerability in the API cannot drop tables, alter schemas, or modify append-only audit logs.
5. **Prometheus + Grafana with Docker Compose**:  
   Delivers enterprise-grade operational observability without third-party vendor lock-in or recurring cloud telemetry bills.
