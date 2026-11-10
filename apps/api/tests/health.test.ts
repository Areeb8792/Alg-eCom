import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/database/connection.js';

describe('Health and Observability Endpoints', () => {
  const app = createApp();

  it('GET /api/v1/health/live should return 200 and alive status', async () => {
    const res = await request(app).get('/api/v1/health/live');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('algions-product-order-api');
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });

  it('GET /api/v1/health/ready should return 200 when database probe succeeds', async () => {
    vi.spyOn(pool, 'query').mockResolvedValueOnce({
      rows: [{ '?column?': 1 }],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: []
    });

    const res = await request(app).get('/api/v1/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.checks.database.status).toBe('healthy');
  });

  it('GET /api/v1/health/ready should return 503 when database probe fails', async () => {
    vi.spyOn(pool, 'query').mockRejectedValueOnce(new Error('Connection refused by postgres:5432'));

    const res = await request(app).get('/api/v1/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unhealthy');
    expect(res.body.checks.database.status).toBe('unhealthy');
    expect(res.body.checks.database.error).toContain('Connection refused');
  });

  it('GET /api/v1/metrics should return Prometheus metrics with uptime and database status', async () => {
    vi.spyOn(pool, 'query').mockResolvedValueOnce({
      rows: [{ '?column?': 1 }],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: []
    });

    const res = await request(app).get('/api/v1/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('process_uptime_seconds');
    expect(res.text).toContain('database_up 1');
    expect(res.headers['content-type']).toContain('text/plain');
  });
});
