import crypto from 'crypto';
import { PoolClient } from 'pg';
import { pool, query } from '../database/connection.js';
import { ProductRepository } from './productRepository.js';

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
  }

  async findByReference(reference: string): Promise<Order | null> {
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
  }

  async createOrderTransactional(params: {
    customerEmail: string;
    customerName: string;
    items: { productId: string; quantity: number }[];
    idempotencyKey?: string;
    requestHash?: string;
  }): Promise<{ order: Order; isDuplicate: boolean; cachedStatusCode?: number; cachedBody?: unknown }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Idempotency handling
      if (params.idempotencyKey && params.requestHash) {
        // Query idempotency record with row-level lock
        const idempRes = await client.query<IdempotencyRecord>(
          `SELECT key, request_hash, status, order_id, response_code, response_body, created_at, updated_at
           FROM idempotency_keys
           WHERE key = $1
           FOR UPDATE;`,
          [params.idempotencyKey]
        );

        if (idempRes.rows.length > 0) {
          const existing = idempRes.rows[0];

          // Check if payload matches
          if (existing.request_hash !== params.requestHash) {
            await client.query('ROLLBACK');
            throw new IdempotencyConflictError(
              `Idempotency-Key "${params.idempotencyKey}" was previously used with a different request payload.`
            );
          }

          // If request is still in progress by another concurrent worker
          if (existing.status === 'IN_PROGRESS') {
            await client.query('ROLLBACK');
            throw new IdempotencyInProgressError(
              `A request with Idempotency-Key "${params.idempotencyKey}" is currently being processed.`
            );
          }

          // Request already resolved: return cached response
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
        } else {
          // Reserve the key as IN_PROGRESS
          await client.query(
            `INSERT INTO idempotency_keys (key, request_hash, status)
             VALUES ($1, $2, 'IN_PROGRESS');`,
            [params.idempotencyKey, params.requestHash]
          );
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
        // Atomic deduction query ensures stock >= quantity and product is_active
        const updatedProduct = await this.productRepo.deductStockAtomic(
          client,
          item.productId,
          item.quantity
        );

        if (!updatedProduct) {
          // Check if product exists to provide clear diagnostics
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

      // 3. Create the order
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const orderRef = `HW-${new Date().getFullYear()}-${randomSuffix}`;

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

      // If failed and idempotency key exists, update to FAILED
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
}
