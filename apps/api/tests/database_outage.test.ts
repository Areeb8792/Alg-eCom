import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/database/connection.js';

describe('Phase 3: Production Database Outage Behavior (No Silent Fallback)', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.ALLOW_IN_MEMORY_FALLBACK;
  });

  it('fails fast with 503 on readiness probe when database is down', async () => {
    vi.spyOn(pool, 'query').mockRejectedValue(new Error('Connection terminated unexpectedly'));

    const res = await request(app).get('/api/v1/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unhealthy');
    expect(res.body.checks.database.status).toBe('unhealthy');
  });

  it('fails with 500 when product catalog cannot query database (no silent in-memory fallback)', async () => {
    vi.spyOn(pool, 'query').mockRejectedValue(new Error('database "algions_db" does not exist'));

    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('fails with 500 when product detail cannot query database', async () => {
    vi.spyOn(pool, 'query').mockRejectedValue(new Error('connection timeout'));

    const res = await request(app).get('/api/v1/products/550e8400-e29b-41d4-a716-446655440000');
    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('fails with 500 on checkout when database pool fails to connect', async () => {
    vi.spyOn(pool, 'connect').mockRejectedValue(new Error('Could not connect to server'));

    const res = await request(app)
      .post('/api/v1/orders')
      .send({
        customerEmail: 'customer@example.com',
        customerName: 'Test Customer',
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 }]
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
