import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { pool } from '../src/database/connection.js';
import { config } from '../src/config/index.js';

describe('Phase 1 Security: Order Lookup Authentication & Privacy Protection', () => {
  const app = createApp();

  const mockOrder = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    order_reference: 'HW-2026-TESTREF',
    customer_name: 'Sophia Laurent',
    customer_email: 'sophia.laurent@example.com',
    status: 'CONFIRMED',
    subtotal_cents: 28000,
    currency: 'USD',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        order_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        product_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        quantity: 2,
        product_name_snapshot: 'Statement Puffer',
        sku_snapshot: 'HW-PF-001',
        unit_price_cents_snapshot: 14000,
        currency_snapshot: 'USD',
        created_at: new Date().toISOString()
      }
    ]
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function setupOrderMock() {
    vi.spyOn(pool, 'query').mockImplementation(async (sql: string | { text: string }) => {
      const sqlText = typeof sql === 'string' ? sql : sql.text;
      if (sqlText.includes('FROM orders')) {
        return {
          rows: [{ ...mockOrder }],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        };
      }
      if (sqlText.includes('FROM order_items')) {
        return {
          rows: [...mockOrder.items],
          rowCount: mockOrder.items.length,
          command: 'SELECT',
          oid: 0,
          fields: []
        };
      }
      return { rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] };
    });
  }

  it('1. Missing Authorization header: returns privacy-masked customer data', async () => {
    setupOrderMock();
    const res = await request(app).get(`/api/v1/orders/${mockOrder.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.is_privacy_masked).toBe(true);
    expect(res.body.data.customer_email).not.toBe('sophia.laurent@example.com');
    expect(res.body.data.customer_email).toContain('****');
    expect(res.body.data.customer_email).toContain('@example.com');
    expect(res.body.data.customer_name).not.toBe('Sophia Laurent');
    expect(res.body.data.customer_name).toContain('***');
  });

  it('2. Malformed Bearer header: returns HTTP 401 UNAUTHORIZED', async () => {
    setupOrderMock();
    const res = await request(app)
      .get(`/api/v1/orders/${mockOrder.id}`)
      .set('Authorization', 'Basic dXNlcjpwYXNz');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('3. Invalid Bearer token string: returns HTTP 401 INVALID_TOKEN (never grants admin)', async () => {
    setupOrderMock();
    const res = await request(app)
      .get(`/api/v1/orders/${mockOrder.id}`)
      .set('Authorization', 'Bearer invalid-token-string-12345');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('4. Forged JWT (signed with wrong secret): returns HTTP 401 INVALID_TOKEN', async () => {
    setupOrderMock();
    const forgedToken = jwt.sign(
      { userId: 'forged-id', username: 'attacker', role: 'ADMIN' },
      'wrong-secret-key-32-characters-long!!'
    );

    const res = await request(app)
      .get(`/api/v1/orders/${mockOrder.id}`)
      .set('Authorization', `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('5. Expired JWT: returns HTTP 401 INVALID_TOKEN', async () => {
    setupOrderMock();
    const expiredToken = jwt.sign(
      { userId: 'admin-id', username: 'admin@algions.com', role: 'ADMIN' },
      config.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get(`/api/v1/orders/${mockOrder.id}`)
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('6. Valid JWT with insufficient permissions (role: USER): returns HTTP 403 FORBIDDEN', async () => {
    setupOrderMock();
    const userToken = jwt.sign(
      { userId: 'user-id', username: 'user@algions.com', role: 'USER' },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get(`/api/v1/orders/${mockOrder.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toContain('Admin role required');
  });

  it('7. Valid administrator JWT: returns HTTP 200 with full unmasked order and PII', async () => {
    setupOrderMock();
    const adminToken = jwt.sign(
      { userId: 'admin-id', username: 'admin@algions.com', role: 'ADMIN' },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get(`/api/v1/orders/${mockOrder.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.is_privacy_masked).toBeUndefined();
    expect(res.body.data.customer_email).toBe('sophia.laurent@example.com');
    expect(res.body.data.customer_name).toBe('Sophia Laurent');
  });

  it('8. Customer lookup with matching verification email: returns privacy-masked customer data (full PII reserved for admin)', async () => {
    setupOrderMock();
    const res = await request(app)
      .get(`/api/v1/orders/${mockOrder.id}?email=sophia.laurent@example.com`);

    expect(res.status).toBe(200);
    expect(res.body.data.is_privacy_masked).toBe(true);
    expect(res.body.data.customer_email).not.toBe('sophia.laurent@example.com');
    expect(res.body.data.customer_email).toContain('****');
    expect(res.body.data.customer_email).toContain('@example.com');
    expect(res.body.data.customer_name).not.toBe('Sophia Laurent');
    expect(res.body.data.customer_name).toContain('***');
  });

  it('9. Customer IDOR attempt: mismatched verification email returns HTTP 404 NOT_FOUND (resolves 403/404 existence oracle)', async () => {
    setupOrderMock();
    const res = await request(app)
      .get(`/api/v1/orders/${mockOrder.id}?email=attacker@malicious.com`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toContain('not found or verification mismatch');
  });

  it('10. Order reference enumeration protection: rate limiter trips after maxRequests', async () => {
    setupOrderMock();
    // Use x-test-rate-limit to enable rate limiter inside test environment
    const testApp = createApp();

    // Make 30 allowed requests
    for (let i = 0; i < 30; i++) {
      const res = await request(testApp)
        .get(`/api/v1/orders/${mockOrder.order_reference}`)
        .set('x-test-rate-limit', 'true');
      expect(res.status).toBe(200);
    }

    // 31st request exceeds rate limit (max 30 / minute)
    const blockedRes = await request(testApp)
      .get(`/api/v1/orders/${mockOrder.order_reference}`)
      .set('x-test-rate-limit', 'true');

    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('11. Missing or invalid verification parameters cannot reveal full order PII', async () => {
    setupOrderMock();
    // 11a: Missing verification parameter completely returns privacy masked
    const anonRes = await request(app).get(`/api/v1/orders/${mockOrder.id}`);
    expect(anonRes.status).toBe(200);
    expect(anonRes.body.data.is_privacy_masked).toBe(true);
    expect(anonRes.body.data.customer_email).toContain('****');
    expect(anonRes.body.data.customer_name).toContain('***');

    // 11b: Empty string email parameter returns privacy masked
    const emptyRes = await request(app).get(`/api/v1/orders/${mockOrder.id}?email=`);
    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.data.is_privacy_masked).toBe(true);
    expect(emptyRes.body.data.customer_email).toContain('****');

    // 11c: Mismatched email parameter returns 404 NOT_FOUND (preventing enumeration)
    const mismatchRes = await request(app).get(`/api/v1/orders/${mockOrder.id}?email=wrong@example.com`);
    expect(mismatchRes.status).toBe(404);
    expect(mismatchRes.body.error.code).toBe('NOT_FOUND');
  });
});
