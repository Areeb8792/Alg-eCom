import crypto from 'crypto';
import { PoolClient } from 'pg';
import { pool, query } from '../database/connection.js';
import { ProductRepository } from './productRepository.js';
import { IN_MEMORY_ORDERS, IN_MEMORY_IDEMPOTENCY, IN_MEMORY_PRODUCTS } from '../database/inMemoryStore.js';
import { config } from '../config/index.js';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price_cents_snapshot: number;
  currency_snapshot: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_reference: string;
  customer_email: string;
  customer_name: string;
  status: string;
  subtotal_cents: number;
  currency: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface IdempotencyRecord {
  key: string;
  request_hash: string;
  status: 'IN_PROGRESS' | 'RESOLVED' | 'FAILED';
  order_id: string | null;
  response_code: number | null;
  response_body: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export class IdempotencyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdempotencyConflictError';
  }
}

export class IdempotencyInProgressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdempotencyInProgressError';
  }
}

export class InsufficientStockError extends Error {
  productId: string;
  productName: string;
  requested: number;
  available: number;

  constructor(productId: string, productName: string, requested: number, available: number) {
    super(`Insufficient stock for product "${productName}". Requested: ${requested}, Available: ${available}`);
    this.name = 'InsufficientStockError';
    this.productId = productId;
    this.productName = productName;
    this.requested = requested;
    this.available = available;
  }
}

export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`Product with ID "${productId}" does not exist or is inactive`);
    this.name = 'ProductNotFoundError';
  }
}

export class OrderRepository {
  private productRepo = new ProductRepository();

  calculatePayloadHash(payload: unknown): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  async findById(orderId: string): Promise<Order | null> {
    try {
      const orderRes = await query<Order>(
        `SELECT id, order_reference, customer_email, customer_name, status, subtotal_cents, currency, created_at, updated_at
         FROM orders
         WHERE id = $1;`,
        [orderId]
      );

      if (!orderRes.rows.length) {
        return null;
      }

      const order = orderRes.rows[0];

      const itemsRes = await query<OrderItem>(
        `SELECT id, order_id, product_id, quantity, product_name_snapshot, sku_snapshot, unit_price_cents_snapshot, currency_snapshot, created_at
         FROM order_items
         WHERE order_id = $1
         ORDER BY created_at ASC;`,
        [orderId]
      );

      order.items = itemsRes.rows;
      return order;
    } catch (err) {
      if (config.NODE_ENV !== 'test') {
        const found = IN_MEMORY_ORDERS.get(orderId);
        return found || null;
      }
      throw err;
    }
  }

  async findByReference(reference: string): Promise<Order | null> {
    try {
      const orderRes = await query<Order>(
        `SELECT id, order_reference, customer_email, customer_name, status, subtotal_cents, currency, created_at, updated_at
         FROM orders
         WHERE order_reference = $1;`,
        [reference]
      );

      if (!orderRes.rows.length) {
        return null;
      }

      const order = orderRes.rows[0];

      const itemsRes = await query<OrderItem>(
        `SELECT id, order_id, product_id, quantity, product_name_snapshot, sku_snapshot, unit_price_cents_snapshot, currency_snapshot, created_at
         FROM order_items
         WHERE order_id = $1
         ORDER BY created_at ASC;`,
        [order.id]
      );

      order.items = itemsRes.rows;
      return order;
    } catch (err) {
      if (config.NODE_ENV !== 'test') {
        for (const o of IN_MEMORY_ORDERS.values()) {
          if (o.order_reference.toUpperCase() === reference.toUpperCase()) {
            return o;
          }
        }
        return null;
      }
      throw err;
    }
  }

  async createOrderTransactional(params: {
    customerEmail: string;
    customerName: string;
    items: { productId: string; quantity: number }[];
    idempotencyKey?: string;
    requestHash?: string;
  }): Promise<{ order: Order; isDuplicate: boolean; cachedStatusCode?: number; cachedBody?: unknown }> {
    let client: PoolClient | null = null;

    try {
      client = await pool.connect();
    } catch (err) {
      if (config.NODE_ENV === 'test') throw err;
      // In dev fallback mode when Postgres is not running:
      return this.createOrderInMemory(params);
    }

    try {
      await client.query('BEGIN');

      // 1. Idempotency handling with atomic reservation
      if (params.idempotencyKey && params.requestHash) {
        // Atomic reservation: insert if not exists
        await client.query(
          `INSERT INTO idempotency_keys (key, request_hash, status)
           VALUES ($1, $2, 'IN_PROGRESS')
           ON CONFLICT (key) DO NOTHING;`,
          [params.idempotencyKey, params.requestHash]
        );

        // Lock row for safe transactional inspection
        const idempRes = await client.query<IdempotencyRecord>(
          `SELECT key, request_hash, status, order_id, response_code, response_body, created_at, updated_at
           FROM idempotency_keys
           WHERE key = $1
           FOR UPDATE;`,
          [params.idempotencyKey]
        );

        if (idempRes.rows.length > 0) {
          const existing = idempRes.rows[0];

          if (existing.request_hash !== params.requestHash) {
            await client.query('ROLLBACK');
            throw new IdempotencyConflictError(
              `Idempotency-Key "${params.idempotencyKey}" was previously used with a different request payload.`
            );
          }

          if (existing.status === 'RESOLVED' && existing.order_id) {
            await client.query('COMMIT');
            const cachedOrder = await this.findById(existing.order_id);
            return {
              order: cachedOrder!,
              isDuplicate: true,
              cachedStatusCode: existing.response_code || 200,
              cachedBody: existing.response_body
            };
          }
        }
      }

      // 2. Validate stock and perform atomic deductions
      let subtotalCents = 0;
      const orderCurrency = 'USD';
      const itemSnapshots: {
        productId: string;
        quantity: number;
        name: string;
        sku: string;
        priceCents: number;
        currency: string;
      }[] = [];

      for (const item of params.items) {
        const updatedProduct = await this.productRepo.deductStockAtomic(
          client,
          item.productId,
          item.quantity
        );

        if (!updatedProduct) {
          const product = await this.productRepo.findById(item.productId, client);
          if (!product || !product.is_active) {
            throw new ProductNotFoundError(item.productId);
          }
          throw new InsufficientStockError(
            product.id,
            product.name,
            item.quantity,
            product.stock
          );
        }

        subtotalCents += updatedProduct.price_cents * item.quantity;
        itemSnapshots.push({
          productId: updatedProduct.id,
          quantity: item.quantity,
          name: updatedProduct.name,
          sku: updatedProduct.sku,
          priceCents: updatedProduct.price_cents,
          currency: updatedProduct.currency
        });
      }

      // 3. Create the order with high-entropy cryptographic reference
      const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
      const currentYear = new Date().getFullYear();
      const orderRef = `HW-${currentYear}-${randomSuffix}`;

      const orderInsertRes = await client.query<Order>(
        `INSERT INTO orders (order_reference, customer_email, customer_name, status, subtotal_cents, currency)
         VALUES ($1, $2, $3, 'CONFIRMED', $4, $5)
         RETURNING id, order_reference, customer_email, customer_name, status, subtotal_cents, currency, created_at, updated_at;`,
        [orderRef, params.customerEmail, params.customerName, subtotalCents, orderCurrency]
      );

      const createdOrder = orderInsertRes.rows[0];

      // 4. Create snapshot order items
      const createdItems: OrderItem[] = [];
      for (const snapshot of itemSnapshots) {
        const itemRes = await client.query<OrderItem>(
          `INSERT INTO order_items (order_id, product_id, quantity, product_name_snapshot, sku_snapshot, unit_price_cents_snapshot, currency_snapshot)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, order_id, product_id, quantity, product_name_snapshot, sku_snapshot, unit_price_cents_snapshot, currency_snapshot, created_at;`,
          [
            createdOrder.id,
            snapshot.productId,
            snapshot.quantity,
            snapshot.name,
            snapshot.sku,
            snapshot.priceCents,
            snapshot.currency
          ]
        );
        createdItems.push(itemRes.rows[0]);
      }

      createdOrder.items = createdItems;

      // 5. Update Idempotency Key to RESOLVED
      if (params.idempotencyKey) {
        const responsePayload = {
          data: {
            order: createdOrder
          }
        };

        await client.query(
          `UPDATE idempotency_keys
           SET status = 'RESOLVED',
               order_id = $1,
               response_code = 201,
               response_body = $2,
               updated_at = NOW()
           WHERE key = $3;`,
          [createdOrder.id, JSON.stringify(responsePayload), params.idempotencyKey]
        );
      }

      await client.query('COMMIT');
      return { order: createdOrder, isDuplicate: false };
    } catch (error) {
      await client.query('ROLLBACK');

      if (params.idempotencyKey && !(error instanceof IdempotencyConflictError) && !(error instanceof IdempotencyInProgressError)) {
        try {
          await query(
            `UPDATE idempotency_keys
             SET status = 'FAILED',
                 updated_at = NOW()
             WHERE key = $1 AND status = 'IN_PROGRESS';`,
            [params.idempotencyKey]
          );
        } catch (_) {
          // ignore cleanup errors
        }
      }

      throw error;
    } finally {
      client.release();
    }
  }

  private createOrderInMemory(params: {
    customerEmail: string;
    customerName: string;
    items: { productId: string; quantity: number }[];
    idempotencyKey?: string;
    requestHash?: string;
  }): { order: Order; isDuplicate: boolean; cachedStatusCode?: number; cachedBody?: unknown } {
    if (params.idempotencyKey && params.requestHash) {
      const existing = IN_MEMORY_IDEMPOTENCY.get(params.idempotencyKey);
      if (existing) {
        if (existing.hash !== params.requestHash) {
          throw new IdempotencyConflictError(
            `Idempotency-Key "${params.idempotencyKey}" was previously used with a different request payload.`
          );
        }
        return {
          order: existing.order,
          isDuplicate: true,
          cachedStatusCode: existing.responseCode,
          cachedBody: { data: { order: existing.order } }
        };
      }
    }

    let subtotalCents = 0;
    const itemSnapshots: OrderItem[] = [];

    for (const item of params.items) {
      const p = IN_MEMORY_PRODUCTS.find((prod) => prod.id === item.productId);
      if (!p || !p.is_active) throw new ProductNotFoundError(item.productId);
      if (p.stock < item.quantity) {
        throw new InsufficientStockError(p.id, p.name, item.quantity, p.stock);
      }
      p.stock -= item.quantity;
      subtotalCents += p.price_cents * item.quantity;
      itemSnapshots.push({
        id: crypto.randomUUID(),
        order_id: '',
        product_id: p.id,
        quantity: item.quantity,
        product_name_snapshot: p.name,
        sku_snapshot: p.sku,
        unit_price_cents_snapshot: p.price_cents,
        currency_snapshot: p.currency,
        created_at: new Date().toISOString()
      });
    }

    const orderId = crypto.randomUUID();
    const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    const currentYear = new Date().getFullYear();
    const orderRef = `HW-${currentYear}-${randomSuffix}`;

    const createdOrder: Order = {
      id: orderId,
      order_reference: orderRef,
      customer_email: params.customerEmail,
      customer_name: params.customerName,
      status: 'CONFIRMED',
      subtotal_cents: subtotalCents,
      currency: 'USD',
      items: itemSnapshots.map((snap) => ({ ...snap, order_id: orderId })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    IN_MEMORY_ORDERS.set(orderId, createdOrder);

    if (params.idempotencyKey && params.requestHash) {
      IN_MEMORY_IDEMPOTENCY.set(params.idempotencyKey, {
        hash: params.requestHash,
        status: 'RESOLVED',
        order: createdOrder,
        responseCode: 201
      });
    }

    return { order: createdOrder, isDuplicate: false };
  }
}
