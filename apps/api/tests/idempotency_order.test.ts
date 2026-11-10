import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/database/connection.js';

describe('Order Creation, Idempotency, and Pricing Integrity', () => {
  const app = createApp();

  const productId = '550e8400-e29b-41d4-a716-446655440000';
  const orderPayload = {
    customerEmail: 'buyer@luxuryfashion.com',
    customerName: 'High Fashion Client',
    items: [
      {
        productId,
        quantity: 2
      }
    ]
  };

  it('calculates total on server and ignores client attempts to manipulate prices', async () => {
    const fakeClient = {
      query: vi.fn(),
      release: vi.fn()
    };

    vi.spyOn(pool, 'connect').mockResolvedValue(fakeClient as any);

    // Mock BEGIN
    fakeClient.query.mockResolvedValueOnce({ rows: [] });

    // Mock deductStockAtomic RETURNING product with real DB price $140.00 (14000 cents)
    fakeClient.query.mockResolvedValueOnce({
      rows: [
        {
          id: productId,
          sku: 'HW-PF-001',
          slug: 'statement-puffer',
          name: 'Statement Puffer',
          description: 'Puffer',
          category: 'OUTERWEAR',
          price_cents: 14000,
          currency: 'USD',
          stock: 10,
          is_active: true,
          image_url: 'https://example.com/puffer.jpg',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    });

    // Mock orders insert returning order with total calculated by server: 2 * 14000 = 28000
    fakeClient.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'order-uuid-1',
          order_reference: 'HW-2024-TEST01',
          customer_email: orderPayload.customerEmail,
          customer_name: orderPayload.customerName,
          status: 'CONFIRMED',
          subtotal_cents: 28000,
          currency: 'USD',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    });

    // Mock order_items insert
    fakeClient.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'item-uuid-1',
          order_id: 'order-uuid-1',
          product_id: productId,
          quantity: 2,
          product_name_snapshot: 'Statement Puffer',
          sku_snapshot: 'HW-PF-001',
          unit_price_cents_snapshot: 14000,
          currency_snapshot: 'USD',
          created_at: new Date().toISOString()
        }
      ]
    });

    // Mock COMMIT
    fakeClient.query.mockResolvedValueOnce({ rows: [] });

    const maliciousPayload = {
      ...orderPayload,
      price: 1, // Malicious attempt to pay $1.00 instead of $280.00
      total: 2
    };

    const res = await request(app)
      .post('/api/v1/orders')
      .send(maliciousPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.order.subtotal_cents).toBe(28000); // 2 * $140.00 = $280.00
    expect(res.body.data.order.items[0].unit_price_cents_snapshot).toBe(14000);
  });

  it('rejects order with 400 when product has insufficient stock', async () => {
    const fakeClient = {
      query: vi.fn(),
      release: vi.fn()
    };

    vi.spyOn(pool, 'connect').mockResolvedValue(fakeClient as any);

    // Mock BEGIN
    fakeClient.query.mockResolvedValueOnce({ rows: [] });

    // Mock deductStockAtomic failing (returns 0 rows because stock < quantity)
    fakeClient.query.mockResolvedValueOnce({ rows: [] });

    // Mock findById to discover available stock
    fakeClient.query.mockResolvedValueOnce({
      rows: [
        {
          id: productId,
          name: 'Statement Puffer',
          stock: 1,
          is_active: true
        }
      ]
    });

    // Mock ROLLBACK
    fakeClient.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/v1/orders')
      .send({
        customerEmail: 'buyer@luxury.com',
        customerName: 'Buyer',
        items: [{ productId, quantity: 5 }] // requesting 5 when only 1 available
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
    expect(res.body.error.available).toBe(1);
    expect(res.body.error.requested).toBe(5);
  });

  it('returns cached response when identical request is sent with same Idempotency-Key', async () => {
    const idempotencyKey = 'client-uuid-key-1234';

    const fakeClient = {
      query: vi.fn(),
      release: vi.fn()
    };

    vi.spyOn(pool, 'connect').mockResolvedValue(fakeClient as any);

    // Mock BEGIN
    fakeClient.query.mockResolvedValueOnce({ rows: [] });

    // Mock SELECT FROM idempotency_keys FOR UPDATE returning existing RESOLVED record
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(JSON.stringify(orderPayload)).digest('hex');

    const cachedOrder = {
      id: 'order-uuid-cached-1',
      order_reference: 'HW-2024-CACHED',
      customer_email: orderPayload.customerEmail,
      customer_name: orderPayload.customerName,
      status: 'CONFIRMED',
      subtotal_cents: 28000,
      currency: 'USD',
      items: [
        {
          id: 'item-uuid-1',
          order_id: 'order-uuid-cached-1',
          product_id: productId,
          quantity: 2,
          product_name_snapshot: 'Statement Puffer',
          sku_snapshot: 'HW-PF-001',
          unit_price_cents_snapshot: 14000,
          currency_snapshot: 'USD',
          created_at: new Date().toISOString()
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    fakeClient.query.mockResolvedValueOnce({
      rows: [
        {
          key: idempotencyKey,
          request_hash: hash,
          status: 'RESOLVED',
          order_id: 'order-uuid-cached-1',
          response_code: 201,
          response_body: { data: { order: cachedOrder } }
        }
      ]
    });

    // Mock COMMIT
    fakeClient.query.mockResolvedValueOnce({ rows: [] });

    // Mock query for finding cached order
    vi.spyOn(pool, 'query')
      .mockResolvedValueOnce({ rows: [cachedOrder] } as any)
      .mockResolvedValueOnce({ rows: cachedOrder.items } as any);

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Idempotency-Key', idempotencyKey)
      .send(orderPayload);

    expect(res.status).toBe(201);
    expect(res.headers['x-idempotent-replayed']).toBe('true');
    expect(res.body.data.order.order_reference).toBe('HW-2024-CACHED');
  });

  it('returns 409 Conflict when same Idempotency-Key is reused with different request payload', async () => {
    const idempotencyKey = 'client-uuid-key-reuse';

    const fakeClient = {
      query: vi.fn(),
      release: vi.fn()
    };

    vi.spyOn(pool, 'connect').mockResolvedValue(fakeClient as any);

    // Mock BEGIN
    fakeClient.query.mockResolvedValueOnce({ rows: [] });

    // Mock SELECT FROM idempotency_keys FOR UPDATE returning existing record with DIFFERENT hash
    fakeClient.query.mockResolvedValueOnce({
      rows: [
        {
          key: idempotencyKey,
          request_hash: 'different_hash_from_earlier_payload',
          status: 'RESOLVED',
          order_id: 'order-uuid-1'
        }
      ]
    });

    // Mock ROLLBACK
    fakeClient.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Idempotency-Key', idempotencyKey)
      .send(orderPayload);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('IDEMPOTENCY_CONFLICT');
  });
});
