import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { parseConfig, Config, DEV_DEFAULT_SECRET } from '../src/config/index.js';

describe('Security & Governance: Configuration & Environment Hardening', () => {
  const baseValidEnv = {
    PORT: '3000',
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://algions_user:algions_password@127.0.0.1:5432/algions_db',
    DATABASE_SSL: 'false',
    JWT_SECRET: 'production-super-secret-key-with-at-least-32-chars-long!',
    JWT_EXPIRES_IN: '1h',
    CORS_ORIGIN: 'https://algions.com,https://api.algions.com',
    RATE_LIMIT_WINDOW_MS: '900000',
    RATE_LIMIT_MAX_REQUESTS: '100',
    LOG_LEVEL: 'info'
  };

  it('Production: should reject missing or empty JWT_SECRET', () => {
    const invalidEnv = { ...baseValidEnv, JWT_SECRET: '' };
    expect(() => parseConfig(invalidEnv)).toThrow(
      /JWT_SECRET must be explicitly set in production environments/
    );
  });

  it('Production: should reject development fallback JWT_SECRET', () => {
    const invalidEnv = {
      ...baseValidEnv,
      JWT_SECRET: DEV_DEFAULT_SECRET
    };
    expect(() => parseConfig(invalidEnv)).toThrow(
      /Development default JWT_SECRET cannot be used in production/
    );
  });

  it('Production: should reject JWT_SECRET shorter than 32 characters', () => {
    const invalidEnv = { ...baseValidEnv, JWT_SECRET: 'short-secret-123' };
    expect(() => parseConfig(invalidEnv)).toThrow(
      /JWT_SECRET must be at least 32 characters long in production/
    );
  });

  it('Production: should reject wildcard CORS_ORIGIN (*)', () => {
    const invalidEnv = { ...baseValidEnv, CORS_ORIGIN: '*' };
    expect(() => parseConfig(invalidEnv)).toThrow(
      /Wildcard CORS_ORIGIN \(\*\) is strictly forbidden in production/
    );
  });

  it('Production: should accept valid configuration', () => {
    const parsed = parseConfig(baseValidEnv);
    expect(parsed.NODE_ENV).toBe('production');
    expect(parsed.JWT_SECRET).toBe('production-super-secret-key-with-at-least-32-chars-long!');
    expect(parsed.CORS_ORIGIN).toBe('https://algions.com,https://api.algions.com');
  });

  it('Development/Test: should permit default development JWT secret and wildcard CORS', () => {
    const devEnv = {
      ...baseValidEnv,
      NODE_ENV: 'development',
      JWT_SECRET: DEV_DEFAULT_SECRET,
      CORS_ORIGIN: '*'
    };
    const parsed = parseConfig(devEnv);
    expect(parsed.NODE_ENV).toBe('development');
    expect(parsed.CORS_ORIGIN).toBe('*');
  });
});

describe('Security & Governance: Production CORS Enforcement', () => {
  const prodConfig: Config = {
    PORT: 3000,
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://algions_user:algions_password@127.0.0.1:5432/algions_db',
    DATABASE_SSL: false,
    JWT_SECRET: 'production-super-secret-key-with-at-least-32-chars-long!',
    JWT_EXPIRES_IN: '1h',
    CORS_ORIGIN: 'https://algions.com,https://api.algions.com',
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 100,
    LOG_LEVEL: 'silent'
  };

  const prodApp = createApp(prodConfig);

  it('should accept requests matching explicitly configured production origin', async () => {
    const res = await request(prodApp)
      .get('/api/v1/health/live')
      .set('Origin', 'https://algions.com');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://algions.com');
  });

  it('should accept requests without an Origin header (server-to-server / health probes)', async () => {
    const res = await request(prodApp).get('/api/v1/health/live');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('Production: should reject unlisted localhost port (e.g. http://localhost:9999)', async () => {
    const res = await request(prodApp)
      .get('/api/v1/health/live')
      .set('Origin', 'http://localhost:9999');

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CORS_FORBIDDEN');
    expect(res.body.error.message).toContain('http://localhost:9999');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('Production: should reject untrusted external domain', async () => {
    const res = await request(prodApp)
      .get('/api/v1/health/live')
      .set('Origin', 'https://attacker.example.com');

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CORS_FORBIDDEN');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('Development/Test: should permit localhost origins when NODE_ENV is test or development', async () => {
    const devConfig: Config = {
      ...prodConfig,
      NODE_ENV: 'test',
      CORS_ORIGIN: 'http://localhost:3000,http://127.0.0.1:3000'
    };
    const devApp = createApp(devConfig);

    const res = await request(devApp)
      .get('/api/v1/health/live')
      .set('Origin', 'http://localhost:9999');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:9999');
  });
});
