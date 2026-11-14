# Algions Product & Order API — Specification & Documentation

Version: `1.0.0`  
Base URL: `/api/v1`  
Protocol: HTTPS (via Nginx reverse proxy)

---

## 1. Authentication & Security Headers

### 1.1 Administrative Endpoints
Protected endpoints require an HTTP Bearer JWT token in the `Authorization` header:
```http
Authorization: Bearer <jwt_token>
```
To obtain a token, authenticate via `POST /api/v1/admin/auth/login`.

### 1.2 Idempotency Key Header
All checkout requests (`POST /api/v1/orders`) support an optional but strongly recommended `Idempotency-Key` header:
```http
Idempotency-Key: <unique_client_uuid_v4>
```
- **Same key + same payload**: Returns original response with HTTP header `X-Idempotent-Replayed: true`.
- **Same key + altered payload**: Returns `HTTP 409 Conflict`.
- **Concurrent identical keys**: Returns `HTTP 409 Conflict`.

---

## 2. API Endpoints Specification

### 2.1 Health & Observability

#### `GET /api/v1/health/live`
Determines if the application process is running and event loop is healthy.
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2026-11-10T12:00:00.000Z",
  "uptimeSeconds": 1420,
  "service": "algions-product-order-api"
}
```

#### `GET /api/v1/health/ready`
Deep readiness check. Pings the PostgreSQL database with an active query (`SELECT 1`).
- **Response**: `200 OK` (when database is connected)
```json
{
  "status": "ok",
  "timestamp": "2026-11-10T12:00:00.000Z",
  "uptimeSeconds": 1420,
  "service": "algions-product-order-api",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTimeMs": 3
    }
  }
}
```
- **Response**: `503 Service Unavailable` (when database is down or unreachable)

#### `GET /api/v1/metrics`
Prometheus-formatted plaintext metrics.
- **Response**: `200 OK` (`text/plain; version=0.0.4`)

---

### 2.2 Product Catalog

#### `GET /api/v1/products`
Retrieves paginated active luxury fashion products.
- **Query Parameters**:
  - `category` (optional, string: `OUTERWEAR`, `TOPS`, `TAILORING`, `ACCESSORIES`)
  - `search` (optional, keyword search across title, description, and SKU)
  - `page` (optional, default `1`)
  - `limit` (optional, default `20`, max `100`)
- **Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "sku": "HW-PF-001",
      "slug": "statement-puffer",
      "name": "Statement Puffer",
      "description": "Silk blend outer shell with technical down fill.",
      "category": "OUTERWEAR",
      "price_cents": 14000,
      "currency": "USD",
      "stock": 15,
      "is_active": true,
      "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000",
      "created_at": "2026-11-10T12:00:00Z",
      "updated_at": "2026-11-10T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 6,
    "totalPages": 1
  }
}
```

#### `GET /api/v1/products/:id`
Retrieves a single product by UUID.
- **Response**: `200 OK` or `404 Not Found`

---

### 2.3 Orders & Checkout

#### `POST /api/v1/orders`
Creates a transactional order, deducts stock atomically, freezes product snapshots, and returns order confirmation.
- **Headers**: `Idempotency-Key: <uuid>` (recommended)
- **Request Body**:
```json
{
  "customerEmail": "alexander@heavyweight.nyc",
  "customerName": "Alexander Vance",
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 2
    }
  ]
}
```
- **Response**: `201 Created`
```json
{
  "data": {
    "order": {
      "id": "771e8400-e29b-41d4-a716-446655440001",
      "order_reference": "HW-2024-X8F2K1",
      "customer_email": "alexander@heavyweight.nyc",
      "customer_name": "Alexander Vance",
      "status": "CONFIRMED",
      "subtotal_cents": 28000,
      "currency": "USD",
      "items": [
        {
          "id": "881e8400-e29b-41d4-a716-446655440002",
          "order_id": "771e8400-e29b-41d4-a716-446655440001",
          "product_id": "550e8400-e29b-41d4-a716-446655440000",
          "quantity": 2,
          "product_name_snapshot": "Statement Puffer",
          "sku_snapshot": "HW-PF-001",
          "unit_price_cents_snapshot": 14000,
          "currency_snapshot": "USD",
          "created_at": "2026-11-10T12:00:00Z"
        }
      ],
      "created_at": "2026-11-10T12:00:00Z",
      "updated_at": "2026-11-10T12:00:00Z"
    }
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Validation error or `INSUFFICIENT_STOCK`
  - `409 Conflict`: `IDEMPOTENCY_CONFLICT` (reused key with different payload) or `IDEMPOTENCY_IN_PROGRESS`

#### `GET /api/v1/orders/:id`
Retrieves an order by internal UUID or public order reference (e.g. `HW-2026-X8F2K1`).
- **Access & Privacy Controls**:
  - **Administrator** (`Authorization: Bearer <admin_jwt>`): Full order details including complete customer PII (`customer_email`, `customer_name`).
  - **Customer Self-Service** (`?email=<customer_email>`): If the query parameter matches the order's customer email, full order details are returned.
  - **Unauthenticated Public Lookup**: If no auth or email is provided, order details are returned with customer PII masked (e.g., `s****@example.com`, `S*** L***`) to protect customer privacy against IDOR.
  - **Mismatched Email**: If `?email` does not match the order, returns `403 Forbidden` (`FORBIDDEN_ORDER_ACCESS`).
  - **Rate Limiting**: Strictly throttled via sliding-window limiter (`30 requests per minute per IP`) returning `429 Too Many Requests` on abuse.
- **Response**: `200 OK`, `403 Forbidden`, `404 Not Found`, or `429 Too Many Requests`

---

### 2.4 Administrative Operations (Protected)

#### `POST /api/v1/admin/auth/login`
- **Request Body**:
```json
{
  "username": "admin@algions.com",
  "password": "AdminSecretPassword123!"
}
```
- **Response**: `200 OK`
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "admin-uuid",
      "username": "admin@algions.com",
      "role": "ADMIN"
    }
  }
}
```

#### `POST /api/v1/admin/products/:id/stock-adjustments`
Protected endpoint to safely add or remove inventory. Automatically logs an audit record.
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Request Body**:
```json
{
  "adjustment": 10,
  "reason": "Shipment receipt from manufacturer"
}
```
- **Response**: `200 OK`

#### `PATCH /api/v1/admin/products/:id`
Updates product title, description, category, price, or active status.
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Request Body**: `{ "is_active": false }`
- **Response**: `200 OK`

#### `GET /api/v1/admin/audit-events`
Retrieves recent audit event records.
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response**: `200 OK`

---

## 3. OpenAPI 3.0 Specification (YAML)

```yaml
openapi: 3.0.3
info:
  title: Algions Product and Order API
  version: 1.0.0
  description: High-reliability e-commerce catalog, transactional order checkout with idempotency, and admin audit operations.
paths:
  /api/v1/health/live:
    get:
      summary: Liveness check
      responses:
        '200':
          description: Process is running
  /api/v1/health/ready:
    get:
      summary: Readiness check
      responses:
        '200':
          description: Database is connected
        '503':
          description: Database is unreachable
  /api/v1/products:
    get:
      summary: List catalog products
      responses:
        '200':
          description: List of products
  /api/v1/orders:
    post:
      summary: Create transactional order
      parameters:
        - in: header
          name: Idempotency-Key
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [customerEmail, customerName, items]
              properties:
                customerEmail:
                  type: string
                  format: email
                customerName:
                  type: string
                items:
                  type: array
                  items:
                    type: object
                    required: [productId, quantity]
                    properties:
                      productId:
                        type: string
                        format: uuid
                      quantity:
                        type: integer
                        minimum: 1
      responses:
        '201':
          description: Order created
        '400':
          description: Insufficient stock or invalid payload
        '409':
          description: Idempotency key conflict
```
