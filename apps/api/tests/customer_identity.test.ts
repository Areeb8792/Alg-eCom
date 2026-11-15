import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Application } from 'express';
import { config } from '../src/config/index.js';

describe('Season 04 Customer Identity, Onboarding & Address Architecture', () => {
  let app: Application;
  const testEmail = `fashion_${Date.now()}@algions-brutalist.com`;
  const testPassword = 'Password123!';
  let authToken: string;
  let verificationToken: string;
  let resetToken: string;
  let addressId: string;

  beforeAll(() => {
    process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';
    app = createApp();
  });

  describe('1. Customer Registration', () => {
    it('rejects registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: testPassword,
          full_name: 'Helmut Lang'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('rejects registration with weak password (missing numbers)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: 'NoNumbersHere!',
          full_name: 'Helmut Lang'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('successfully registers a new customer with default preferences and verification token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          full_name: 'Areeb Designer',
          phone: '+1-555-0199'
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.user.full_name).toBe('Areeb Designer');
      expect(res.body.data.user.is_verified).toBe(false);
      expect(res.body.data.preferences).toBeDefined();
      expect(res.body.data.preferences.onboarding_completed).toBe(false);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.verificationToken).toBeDefined();
      expect(res.body.data.email_delivery).toBeDefined();
      expect(res.body.data.email_delivery.mode).toBe('DEVELOPMENT_SIMULATION');
      expect(res.body.data.email_delivery.provider).toBe('CONSOLE_LOGGER');

      authToken = res.body.data.token;
      verificationToken = res.body.data.verificationToken;
    });

    it('rejects duplicate registration with identical email (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          full_name: 'Areeb Duplicate'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('2. Customer Login & Authentication', () => {
    it('authenticates valid credentials and issues token pair', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.preferences).toBeDefined();
      authToken = res.body.data.token;
    });

    it('rejects invalid password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword999!'
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects unregistered email with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@algions.com',
          password: testPassword
        });

      expect(res.status).toBe(401);
    });
  });

  describe('3. Email Verification Architecture', () => {
    it('verifies customer email with valid verification token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: verificationToken });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);

      // Verify that profile reflects verified status
      const profileRes = await request(app)
        .get('/api/v1/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.data.is_verified).toBe(true);
    });

    it('rejects reuse of already-used verification token (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: verificationToken });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('TOKEN_ALREADY_USED');
    });

    it('resends verification token for unverified accounts', async () => {
      const newEmail = `unverified_${Date.now()}@algions-brutalist.com`;
      await request(app)
        .post('/api/v1/auth/register')
        .send({ email: newEmail, password: testPassword, full_name: 'Unverified Test' });

      const res = await request(app)
        .post('/api/v1/auth/resend-verification')
        .send({ email: newEmail });

      expect(res.status).toBe(200);
      expect(res.body.data.verificationToken).toBeDefined();
      expect(res.body.data.email_delivery).toBeDefined();
      expect(res.body.data.email_delivery.mode).toBe('DEVELOPMENT_SIMULATION');
    });
  });

  describe('4. Password Reset Workflow', () => {
    it('generates a password reset token for registered customer', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testEmail });

      expect(res.status).toBe(200);
      expect(res.body.data.resetToken).toBeDefined();
      expect(res.body.data.email_delivery).toBeDefined();
      expect(res.body.data.email_delivery.mode).toBe('DEVELOPMENT_SIMULATION');
      resetToken = res.body.data.resetToken;
    });

    it('strictly suppresses raw tokens in production environment (token non-disclosure policy)', async () => {
      const originalEnv = config.NODE_ENV;
      try {
        (config as any).NODE_ENV = 'production';

        const regRes = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: `prod_token_leak_check_${Date.now()}@algions.com`,
            password: testPassword,
            full_name: 'Production Token Audit'
          });

        expect(regRes.status).toBe(201);
        expect(regRes.body.data.verificationToken).toBeUndefined();

        const forgotRes = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({ email: testEmail });

        expect(forgotRes.status).toBe(200);
        expect(forgotRes.body.data.resetToken).toBeUndefined();
      } finally {
        (config as any).NODE_ENV = originalEnv;
      }
    });

    it('resets password successfully with valid token', async () => {
      const newPassword = 'NewSecretPassword2026!';
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);

      // Old password should now fail
      const oldLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });
      expect(oldLoginRes.status).toBe(401);

      // New password should succeed
      const newLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: newPassword });
      expect(newLoginRes.status).toBe(200);
      authToken = newLoginRes.body.data.token;
    });
  });

  describe('5. Customer Profile & Security Guards', () => {
    it('blocks unauthenticated access to /user/profile with 401', async () => {
      const res = await request(app).get('/api/v1/user/profile');
      expect(res.status).toBe(401);
    });

    it('fetches profile data for authenticated customer', async () => {
      const res = await request(app)
        .get('/api/v1/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.full_name).toBe('Areeb Designer');
    });

    it('updates customer profile (full_name, phone)', async () => {
      const res = await request(app)
        .patch('/api/v1/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          full_name: 'Areeb Chief Creative',
          phone: '+1-555-9988'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.full_name).toBe('Areeb Chief Creative');
      expect(res.body.data.phone).toBe('+1-555-9988');
    });
  });

  describe('6. Season 04 Onboarding & Fashion Preferences', () => {
    it('retrieves default customer preferences before onboarding', async () => {
      const res = await request(app)
        .get('/api/v1/user/preferences')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.onboarding_completed).toBe(false);
      expect(res.body.data.favorite_categories).toEqual([]);
    });

    it('persists multi-facet onboarding choices (categories, styles, fits, sizes, colors)', async () => {
      const preferencesPayload = {
        gender_presentation: 'AVANT_GARDE' as const,
        favorite_categories: ['OUTERWEAR', 'TAILORING', 'FOOTWEAR'],
        preferred_styles: ['BRUTALIST', 'MINIMALIST', 'TECHNICAL'],
        preferred_fits: ['OVERSIZED', 'STRUCTURED'],
        preferred_sizes: ['M', 'L'],
        preferred_colors: ['BLACK', 'CHALK', 'BURNT_RED'],
        price_range_min_cents: 10000,
        price_range_max_cents: 350000,
        onboarding_completed: true,
        newsletter_subscribed: true
      };

      const res = await request(app)
        .put('/api/v1/user/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preferencesPayload);

      expect(res.status).toBe(200);
      expect(res.body.data.onboarding_completed).toBe(true);
      expect(res.body.data.favorite_categories).toContain('OUTERWEAR');
      expect(res.body.data.preferred_styles).toContain('BRUTALIST');
      expect(res.body.data.preferred_fits).toContain('OVERSIZED');
      expect(res.body.data.preferred_sizes).toContain('L');
      expect(res.body.data.preferred_colors).toContain('BURNT_RED');
    });

    it('persists preferences across logout and re-login', async () => {
      // Logout
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      // Re-login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'NewSecretPassword2026!' });

      expect(loginRes.status).toBe(200);
      const newAuthToken = loginRes.body.data.token;
      expect(loginRes.body.data.preferences.onboarding_completed).toBe(true);
      expect(loginRes.body.data.preferences.favorite_categories).toContain('OUTERWEAR');

      // Fetch preferences endpoint directly
      const prefRes = await request(app)
        .get('/api/v1/user/preferences')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(prefRes.status).toBe(200);
      expect(prefRes.body.data.preferred_styles).toContain('BRUTALIST');
      authToken = newAuthToken;
    });
  });

  describe('7. Customer Address Book', () => {
    it('creates a new customer shipping address', async () => {
      const res = await request(app)
        .post('/api/v1/user/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          label: 'Atelier / Studio',
          recipient_name: 'Areeb Sayyed',
          phone: '+1-555-1234',
          address_line1: '742 Brutalist Way',
          address_line2: 'Floor 4',
          city: 'New York',
          state_province: 'NY',
          postal_code: '10001',
          country_code: 'US',
          is_default_shipping: true,
          is_default_billing: true
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.label).toBe('Atelier / Studio');
      expect(res.body.data.is_default_shipping).toBe(true);
      addressId = res.body.data.id;
    });

    it('lists all saved customer addresses', async () => {
      const res = await request(app)
        .get('/api/v1/user/addresses')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].id).toBe(addressId);
    });

    it('updates existing address attributes', async () => {
      const res = await request(app)
        .patch(`/api/v1/user/addresses/${addressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          label: 'Flagship Studio',
          address_line2: 'Penthouse Suite'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.label).toBe('Flagship Studio');
      expect(res.body.data.address_line2).toBe('Penthouse Suite');
    });

    it('deletes saved customer address', async () => {
      const res = await request(app)
        .delete(`/api/v1/user/addresses/${addressId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);

      const listRes = await request(app)
        .get('/api/v1/user/addresses')
        .set('Authorization', `Bearer ${authToken}`);

      expect(listRes.body.data.find((a: any) => a.id === addressId)).toBeUndefined();
    });
  });

  describe('8. Refresh Token Rotation & Session Security', () => {
    let rotationEmail: string;
    let rotationPassword = 'SecureRotationPass123!';
    let currentAuthToken: string;
    let currentRefreshToken: string;

    beforeAll(async () => {
      rotationEmail = `rotation_${Date.now()}@algions-brutalist.com`;
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: rotationEmail,
          password: rotationPassword,
          full_name: 'Rotation Tester'
        });
      currentAuthToken = regRes.body.data.token;
      currentRefreshToken = regRes.body.data.refreshToken;
    });

    it('rotates refresh token and returns new token pair', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: currentRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.refreshToken).not.toBe(currentRefreshToken);

      const oldSpentToken = currentRefreshToken;
      currentAuthToken = res.body.data.token;
      currentRefreshToken = res.body.data.refreshToken;

      // Verify that the new access token can access protected routes
      const profileRes = await request(app)
        .get('/api/v1/user/profile')
        .set('Authorization', `Bearer ${currentAuthToken}`);
      expect(profileRes.status).toBe(200);

      // Verify reuse detection: Replaying the old spent token triggers TOKEN_REUSE_DETECTED
      const reuseRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldSpentToken });

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.error.code).toBe('TOKEN_REUSE_DETECTED');

      // Verify that all sessions for this user were revoked due to detected replay
      const nextRefresh = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: currentRefreshToken });
      expect(nextRefresh.status).toBe(401);
    });

    it('rejects refresh with invalid or malformed token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'non-existent-or-tampered-token-value' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('authenticated logout revokes active session', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: rotationEmail,
          password: rotationPassword
        });

      const token = loginRes.body.data.token;
      const rToken = loginRes.body.data.refreshToken;

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({ refreshToken: rToken });

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.data.success).toBe(true);

      // Attempting to refresh with the logged out token fails
      const refreshAfterLogout = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: rToken });
      expect(refreshAfterLogout.status).toBe(401);
    });

    it('sets HTTP-only refresh cookie and anti-CSRF token on authentication', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: rotationEmail,
          password: rotationPassword
        });

      expect(res.status).toBe(200);
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const refreshCookie = cookies.find((c: string) => c.includes('algions_refresh_token'));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
      expect(refreshCookie).toContain('Path=/');

      const csrfCookie = cookies.find((c: string) => c.includes('algions_csrf_token'));
      expect(csrfCookie).toBeDefined();

      // Extract cookies for refresh test
      const refreshVal = refreshCookie.split(';')[0];
      const csrfVal = csrfCookie.split(';')[0].split('=')[1];

      // Refreshing using the HTTP-only cookie with matching CSRF header
      const cookieRefreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [refreshVal, `algions_csrf_token=${csrfVal}`])
        .set('x-csrf-token', csrfVal)
        .send({});

      expect(cookieRefreshRes.status).toBe(200);
      expect(cookieRefreshRes.body.data.token).toBeDefined();

      // Reject refresh if CSRF token mismatch is detected
      const forgedCsrfRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [refreshVal, `algions_csrf_token=${csrfVal}`])
        .set('x-csrf-token', 'tampered-csrf-token')
        .send({});

      expect(forgedCsrfRes.status).toBe(403);
      expect(forgedCsrfRes.body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });
  });
});
