import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { pool } from '../src/database/connection.js';
import { config } from '../src/config/index.js';

describe('Admin Authentication and Authorization Security', () => {
  const app = createApp();

  it('rejects protected admin operations when Authorization header is missing', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/products/550e8400-e29b-41d4-a716-446655440000')
      .send({ name: 'Hacked Title' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects protected admin operations when token is forged or invalid', async () => {
    const forgedToken = jwt.sign({ userId: 'fake', role: 'ADMIN' }, 'wrong_secret_key');

    const res = await request(app)
      .patch('/api/v1/admin/products/550e8400-e29b-41d4-a716-446655440000')
      .set('Authorization', `Bearer ${forgedToken}`)
      .send({ name: 'Hacked Title' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('rejects non-admin role tokens with 403 Forbidden', async () => {
    const customerToken = jwt.sign({ userId: 'user-1', role: 'CUSTOMER' }, config.JWT_SECRET);

    const res = await request(app)
      .patch('/api/v1/admin/products/550e8400-e29b-41d4-a716-446655440000')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Hacked Title' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('successfully authenticates admin login with correct password', async () => {
    const passwordHash = await bcrypt.hash('Secret123!', 10);

    vi.spyOn(pool, 'query').mockResolvedValueOnce({
      rows: [
        {
          id: 'admin-uuid-1',
          username: 'admin@algions.com',
          password_hash: passwordHash,
          role: 'ADMIN',
          created_at: new Date().toISOString()
        }
      ],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: []
    });

    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ username: 'admin@algions.com', password: 'Secret123!' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.username).toBe('admin@algions.com');
  });
});
