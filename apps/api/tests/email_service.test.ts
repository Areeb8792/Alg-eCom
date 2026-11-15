import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Transporter } from 'nodemailer';
import {
  EmailService,
  IN_MEMORY_DEV_EMAILS,
  EmailDispatchResult
} from '../src/services/emailService.js';
import { config } from '../src/config/index.js';

describe('EmailService & SMTP Architecture', () => {
  beforeEach(() => {
    IN_MEMORY_DEV_EMAILS.length = 0;
  });

  describe('1. Development & Test Simulation Mode', () => {
    it('dispatches verification email to dev preview store when SMTP is unconfigured in test mode', async () => {
      const emailService = new EmailService(null);
      const recipient = 'buyer@algions-brutalist.com';
      const token = 'crypto-verification-token-12345';

      const result = await emailService.sendVerificationEmail(recipient, 'Areeb Designer', token);

      expect(result.status).toBe('simulated');
      expect(result.success).toBe(true);
      expect(result.provider).toBe('CONSOLE_LOGGER');
      expect(result.mode).toBe('DEVELOPMENT_SIMULATION');
      expect(result.devTokenHint).toBe(token);
      expect(result.previewUrl).toContain('/dev/emails/');

      // Verify that record was stored in development preview store
      expect(IN_MEMORY_DEV_EMAILS.length).toBe(1);
      const record = IN_MEMORY_DEV_EMAILS[0];
      expect(record.recipient).toBe(recipient);
      expect(record.previewLabel).toBe('[DEVELOPMENT EMAIL PREVIEW - SMTP NOT CONFIGURED]');
      expect(record.token).toBe(token);
      expect(record.text).toContain(token);
      expect(record.html).toContain(token);
      expect(record.html).toContain('HEAVYWEIGHT');
    });

    it('dispatches password reset email to dev preview store with recovery cipher', async () => {
      const emailService = new EmailService(null);
      const recipient = 'reset@algions-brutalist.com';
      const resetToken = 'cipher-recovery-99999';

      const result = await emailService.sendPasswordResetEmail(recipient, 'Atelier Master', resetToken);

      expect(result.status).toBe('simulated');
      expect(result.success).toBe(true);
      expect(result.devTokenHint).toBe(resetToken);

      expect(IN_MEMORY_DEV_EMAILS.length).toBe(1);
      const record = IN_MEMORY_DEV_EMAILS[0];
      expect(record.subject).toContain('Password Reset Cipher');
      expect(record.text).toContain(resetToken);
      expect(record.html).toContain('#C72A09'); // Season 04 Burnt-red security cipher accent
    });
  });

  describe('2. Verified SMTP Provider Dispatch', () => {
    it('dispatches email via configured SMTP transporter and accurately records delivery evidence', async () => {
      const mockSendMail = vi.fn().mockResolvedValue({
        messageId: '<msg-uuid-12345@algions.com>',
        accepted: ['buyer@algions-brutalist.com'],
        rejected: [],
        pending: [],
        response: '250 2.0.0 OK: message queued 12345'
      });

      const mockTransporter = {
        sendMail: mockSendMail
      } as unknown as Transporter;

      const emailService = new EmailService(mockTransporter);
      const result: EmailDispatchResult = await emailService.sendVerificationEmail(
        'buyer@algions-brutalist.com',
        'Verified Customer',
        'token-smtp-xyz'
      );

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('sent');
      expect(result.success).toBe(true);
      expect(result.mode).toBe('PRODUCTION_SMTP');
      expect(result.provider).toBe('SMTP');
      expect(result.messageId).toBe('<msg-uuid-12345@algions.com>');
      expect(result.providerResponse).toBe('250 2.0.0 OK: message queued 12345');
      expect(result.error).toBeUndefined();

      // Ensure that in real SMTP mode, dev simulation store is not polluted
      expect(IN_MEMORY_DEV_EMAILS.length).toBe(0);
    });

    it('accurately records queued status if message is pending on remote SMTP relay', async () => {
      const mockSendMail = vi.fn().mockResolvedValue({
        messageId: '<msg-queued-99@algions.com>',
        accepted: [],
        rejected: [],
        pending: ['buyer@algions-brutalist.com'],
        response: '250 2.0.0 Queued for delivery'
      });

      const mockTransporter = {
        sendMail: mockSendMail
      } as unknown as Transporter;

      const emailService = new EmailService(mockTransporter);
      const result = await emailService.sendVerificationEmail(
        'buyer@algions-brutalist.com',
        'Queued Customer',
        'token-queued-1'
      );

      expect(result.status).toBe('queued');
      expect(result.success).toBe(true);
      expect(result.mode).toBe('PRODUCTION_SMTP');
      expect(result.provider).toBe('SMTP');
    });

    it('accurately records failure when SMTP provider rejects connection or fails authentication', async () => {
      const mockSendMail = vi.fn().mockRejectedValue(new Error('ESOCKETTIMEDOUT: Connection to smtp.mailgun.org:587 timed out'));

      const mockTransporter = {
        sendMail: mockSendMail
      } as unknown as Transporter;

      const emailService = new EmailService(mockTransporter);
      const result = await emailService.sendVerificationEmail(
        'failure@algions-brutalist.com',
        'Failed Recipient',
        'token-fail-1'
      );

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('failed');
      expect(result.success).toBe(false);
      expect(result.mode).toBe('DELIVERY_FAILED');
      expect(result.provider).toBe('SMTP');
      expect(result.error).toContain('ESOCKETTIMEDOUT');
      expect(result.messageId).toBeUndefined();
    });
  });

  describe('3. Production Security & Fail-Closed Guardrails', () => {
    it('prevents silent fallback to simulation when running in production mode without SMTP credentials', async () => {
      const originalEnv = config.NODE_ENV;
      try {
        (config as any).NODE_ENV = 'production';

        const unconfiguredEmailService = new EmailService(null);
        const result = await unconfiguredEmailService.sendVerificationEmail(
          'target@algions.com',
          'Production User',
          'prod-secret-token'
        );

        // Security Policy: In production, unconfigured email service MUST fail explicitly, never pretend delivered
        expect(result.status).toBe('failed');
        expect(result.success).toBe(false);
        expect(result.mode).toBe('DELIVERY_FAILED');
        expect(result.error).toContain('Production email delivery unavailable: SMTP credentials not configured.');
        expect(IN_MEMORY_DEV_EMAILS.length).toBe(0);
      } finally {
        (config as any).NODE_ENV = originalEnv;
      }
    });
  });

  describe('4. Commerce Lifecycle Templates', () => {
    it('formats order confirmation with items and currency', async () => {
      const emailService = new EmailService(null);
      const result = await emailService.sendOrderConfirmationEmail(
        'client@algions.com',
        'Art Director',
        {
          reference: 'ORD-HW-2026-99',
          totalCents: 21000,
          currency: 'INR'
        }
      );

      expect(result.success).toBe(true);
      const record = IN_MEMORY_DEV_EMAILS[0];
      expect(record.subject).toContain('ORD-HW-2026-99');
      expect(record.text).toContain('ORD-HW-2026-99');
      expect(record.html).toContain('STATUS: ALLOCATED // IN PREPARATION');
    });

    it('formats shipping update with logistics carrier and tracking number', async () => {
      const emailService = new EmailService(null);
      const result = await emailService.sendShippingUpdateEmail(
        'client@algions.com',
        'Art Director',
        {
          orderReference: 'ORD-HW-2026-99',
          carrier: 'BLUEDART_EXPRESS',
          trackingNumber: 'WAYBILL-77889900'
        }
      );

      expect(result.success).toBe(true);
      const record = IN_MEMORY_DEV_EMAILS[0];
      expect(record.subject).toContain('Dispatched: ORD-HW-2026-99');
      expect(record.text).toContain('WAYBILL-77889900');
      expect(record.text).toContain('BLUEDART_EXPRESS');
    });
  });
});
