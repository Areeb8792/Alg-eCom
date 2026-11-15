import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../logging/logger.js';

export type EmailDeliveryStatus = 'sent' | 'queued' | 'failed' | 'simulated';

export interface EmailDispatchResult {
  status: EmailDeliveryStatus;
  success: boolean;
  mode: 'PRODUCTION_SMTP' | 'DEVELOPMENT_SIMULATION' | 'DELIVERY_FAILED';
  provider: 'SMTP' | 'CONSOLE_LOGGER';
  messageId?: string;
  recipient: string;
  subject: string;
  dispatchedAt: string;
  error?: string;
  previewUrl?: string;
  devTokenHint?: string;
  providerResponse?: string;
}

export interface DispatchedEmailRecord {
  id: string;
  recipient: string;
  subject: string;
  text: string;
  html: string;
  dispatchedAt: string;
  mode: 'PRODUCTION_SMTP' | 'DEVELOPMENT_SIMULATION';
  token?: string;
  previewLabel: string;
}

// Security: HTML-escape user-controlled values before embedding in email templates
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Development preview store (accessible in dev/test for inspection)
export const IN_MEMORY_DEV_EMAILS: DispatchedEmailRecord[] = [];

export function getDevEmails(): DispatchedEmailRecord[] {
  return [...IN_MEMORY_DEV_EMAILS];
}

export function getDevEmailById(id: string): DispatchedEmailRecord | undefined {
  return IN_MEMORY_DEV_EMAILS.find((e) => e.id === id);
}

export class EmailService {
  private transporter: Transporter | null = null;

  constructor(customTransporter?: Transporter | null) {
    if (customTransporter !== undefined) {
      this.transporter = customTransporter;
    } else if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
      });
      logger.info(
        { host: config.SMTP_HOST, port: config.SMTP_PORT },
        'EmailService initialized with active SMTP transport'
      );
    } else {
      logger.info(
        { env: config.NODE_ENV },
        'EmailService initialized in simulation mode (SMTP_HOST or credentials not provided)'
      );
    }
  }

  setTransporter(transporter: Transporter | null): void {
    this.transporter = transporter;
  }

  getTransporter(): Transporter | null {
    return this.transporter;
  }

  private async dispatch(
    to: string,
    subject: string,
    text: string,
    html: string,
    tokenHint?: string
  ): Promise<EmailDispatchResult> {
    const dispatchedAt = new Date().toISOString();

    // 1. SMTP Transport configured (Production or Test SMTP provider)
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: config.SMTP_FROM,
          to,
          subject,
          text,
          html,
        });

        const accepted = Array.isArray(info.accepted) ? info.accepted.map(String) : [];
        const rejected = Array.isArray(info.rejected) ? info.rejected.map(String) : [];
        const pending = Array.isArray(info.pending) ? info.pending.map(String) : [];
        const normalizedTo = to.toLowerCase();

        // Exact SMTP Delivery Classification
        const isExplicitlyRejected = rejected.some((r) => r.toLowerCase().includes(normalizedTo)) || rejected.length > 0;
        const isQueued =
          pending.some((p) => p.toLowerCase().includes(normalizedTo)) ||
          (pending.length > 0 && typeof info.response === 'string' && /queued/i.test(info.response));
        const isExplicitlyAccepted =
          accepted.some((a) => a.toLowerCase().includes(normalizedTo)) ||
          accepted.length > 0 ||
          (Boolean(info.messageId) && !isExplicitlyRejected && !isQueued);

        let deliveryStatus: EmailDeliveryStatus;
        if (isExplicitlyRejected) {
          deliveryStatus = 'failed';
        } else if (isQueued) {
          deliveryStatus = 'queued';
        } else if (isExplicitlyAccepted) {
          deliveryStatus = 'sent';
        } else {
          deliveryStatus = 'failed';
        }

        logger.info(
          {
            recipient: to,
            subject,
            messageId: info.messageId,
            status: deliveryStatus,
            acceptedCount: accepted.length,
            rejectedCount: rejected.length,
            response: info.response,
          },
          'Email processed by SMTP transport provider'
        );

        return {
          status: deliveryStatus,
          success: deliveryStatus === 'sent' || deliveryStatus === 'queued',
          mode: 'PRODUCTION_SMTP',
          provider: 'SMTP',
          messageId: info.messageId,
          providerResponse: typeof info.response === 'string' ? info.response : undefined,
          recipient: to,
          subject,
          dispatchedAt,
        };
      } catch (err: any) {
        logger.error(
          { recipient: to, subject, error: err.message },
          'Failed to dispatch email via SMTP transport'
        );
        return {
          status: 'failed',
          success: false,
          mode: 'DELIVERY_FAILED',
          provider: 'SMTP',
          recipient: to,
          subject,
          dispatchedAt,
          error: err.message || 'SMTP delivery failure',
        };
      }
    }

    // 2. Production WITHOUT SMTP credentials -> Fail explicitly (never pretend delivered or simulate in production)
    if (config.NODE_ENV === 'production') {
      logger.error(
        { recipient: to, subject },
        'CRITICAL SECURITY ALERT: Email delivery blocked. Production mode requires valid SMTP transport.'
      );
      return {
        status: 'failed',
        success: false,
        mode: 'DELIVERY_FAILED',
        provider: 'CONSOLE_LOGGER',
        recipient: to,
        subject,
        dispatchedAt,
        error: 'Production email delivery unavailable: SMTP credentials not configured.',
      };
    }

    // 3. Development / Test simulation mode (Clearly labelled preview store)
    const emailRecord: DispatchedEmailRecord = {
      id: `dev-mail-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      recipient: to,
      subject,
      text,
      html,
      dispatchedAt,
      mode: 'DEVELOPMENT_SIMULATION',
      token: tokenHint,
      previewLabel: '[DEVELOPMENT EMAIL PREVIEW - SMTP NOT CONFIGURED]',
    };
    IN_MEMORY_DEV_EMAILS.push(emailRecord);

    logger.info(
      {
        recipient: to,
        subject,
        devTokenHint: tokenHint,
        recordId: emailRecord.id,
      },
      '[DEVELOPMENT PREVIEW] Simulation email stored for dev preview'
    );

    return {
      status: 'simulated',
      success: true,
      mode: 'DEVELOPMENT_SIMULATION',
      provider: 'CONSOLE_LOGGER',
      recipient: to,
      subject,
      dispatchedAt,
      devTokenHint: tokenHint,
      previewUrl: `/dev/emails/${emailRecord.id}`,
    };
  }

  // --- Specific Email Flows with Brutalist Season 04 Styling & Sanitization ---

  async sendVerificationEmail(to: string, name: string, token: string): Promise<EmailDispatchResult> {
    const safeName = escapeHtml(name);
    const safeToken = escapeHtml(token);
    const subject = 'HEAVYWEIGHT // Verify Customer Identity';

    const text = [
      `HEAVYWEIGHT — SEASON 04`,
      `=======================`,
      `GREETINGS ${name.toUpperCase()},`,
      ``,
      `Please verify your communication address to activate your customer dossier.`,
      `Verification Token: ${token}`,
      ``,
      `This cryptographic token will expire in 24 hours.`,
      `If you did not initiate this registration, no action is required.`,
      ``,
      `ALGIONS AI LABS // ARCHIVAL PROTOCOL`,
    ].join('\n');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(subject)}</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #E3E2DE; font-family: 'JetBrains Mono', monospace, Courier, sans-serif; color: #1B0E0D;">
        <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 2px solid #1B0E0D; padding: 32px;">
          <div style="border-bottom: 2px solid #1B0E0D; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">HEAVYWEIGHT</span>
            <span style="font-size: 11px; font-weight: bold; background: #1B0E0D; color: #E3E2DE; padding: 4px 8px; letter-spacing: 1px;">SEASON 04</span>
          </div>

          <h1 style="font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0 0 16px 0; letter-spacing: 0.5px;">Customer Dossier Verification</h1>
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">Greetings <strong>${safeName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">Please authenticate your communication address to finalize your bespoke fashion profile.</p>

          <div style="background: #1B0E0D; color: #31EF07; border: 1px solid #1B0E0D; padding: 16px; text-align: center; margin: 24px 0;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #E3E2DE; margin-bottom: 8px;">Single-Use Verification Cipher</div>
            <div style="font-size: 20px; font-weight: 700; letter-spacing: 3px; word-break: break-all;">${safeToken}</div>
          </div>

          <div style="border-top: 1px solid #D9D9D9; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #666666; line-height: 1.5;">
            <p style="margin: 0 0 8px 0;">Security Policy: Token valid for exactly 24 hours. Single-use cryptographic invalidation upon redemption.</p>
            <p style="margin: 0;">ALGIONS AI LABS // LUXURY E-COMMERCE INFRASTRUCTURE</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.dispatch(to, subject, text, html, token);
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<EmailDispatchResult> {
    const safeName = escapeHtml(name);
    const safeToken = escapeHtml(token);
    const subject = 'HEAVYWEIGHT // Cryptographic Password Reset Cipher';

    const text = [
      `HEAVYWEIGHT — SEASON 04`,
      `=======================`,
      `GREETINGS ${name.toUpperCase()},`,
      ``,
      `A password recovery request has been initiated for your customer account.`,
      `Reset Token: ${token}`,
      ``,
      `This token is valid for 60 minutes only and will be revoked after single use.`,
      `If you did not request this password recovery, please ignore this email or review your account sessions immediately.`,
      ``,
      `ALGIONS AI LABS // SECURITY GOVERNANCE`,
    ].join('\n');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(subject)}</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #E3E2DE; font-family: 'JetBrains Mono', monospace, Courier, sans-serif; color: #1B0E0D;">
        <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 2px solid #C72A09; padding: 32px;">
          <div style="border-bottom: 2px solid #C72A09; padding-bottom: 16px; margin-bottom: 24px;">
            <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">HEAVYWEIGHT</span>
            <span style="font-size: 11px; font-weight: bold; background: #C72A09; color: #FFFFFF; padding: 4px 8px; margin-left: 8px;">SECURITY CIPHER</span>
          </div>

          <h1 style="font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0 0 16px 0; color: #C72A09;">Credential Rotation Protocol</h1>
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">Greetings <strong>${safeName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">A password reset request was initiated for your dossier. Enter the cipher below in the reset dialog to establish new credentials:</p>

          <div style="background: #1B0E0D; color: #FFFFFF; border: 2px solid #C72A09; padding: 16px; text-align: center; margin: 24px 0;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #C72A09; margin-bottom: 8px;">60-Minute Recovery Token</div>
            <div style="font-size: 20px; font-weight: 700; letter-spacing: 3px; word-break: break-all; color: #FFFFFF;">${safeToken}</div>
          </div>

          <div style="border-top: 1px solid #D9D9D9; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #666666; line-height: 1.5;">
            <p style="margin: 0 0 8px 0;">Notice: If you did not authorize this request, your existing password remains unchanged.</p>
            <p style="margin: 0;">ALGIONS AI LABS // ARCHIVAL PROTOCOL</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.dispatch(to, subject, text, html, token);
  }

  async sendOrderConfirmationEmail(
    to: string,
    name: string,
    order: { reference: string; totalCents: number; currency: string }
  ): Promise<EmailDispatchResult> {
    const safeName = escapeHtml(name);
    const safeReference = escapeHtml(order.reference);
    const totalFormatted = (order.totalCents / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: order.currency || 'INR',
    });
    const subject = `HEAVYWEIGHT // Order Confirmed: ${order.reference}`;

    const text = [
      `HEAVYWEIGHT — SEASON 04`,
      `=======================`,
      `ORDER CONFIRMATION // ALLOCATED`,
      ``,
      `GREETINGS ${name.toUpperCase()},`,
      ``,
      `Order Reference: ${order.reference}`,
      `Total Amount: ${totalFormatted}`,
      ``,
      `Your acquisition has been confirmed and reserved. Our atelier is currently preparing your pieces for bespoke packaging.`,
      ``,
      `Track your shipment at: http://localhost:3000/track-order`,
      ``,
      `ALGIONS AI LABS // LOGISTICS PROTOCOL`,
    ].join('\n');

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 24px; background-color: #E3E2DE; font-family: monospace; color: #1B0E0D;">
        <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 2px solid #1B0E0D; padding: 32px;">
          <div style="border-bottom: 2px solid #1B0E0D; padding-bottom: 16px; margin-bottom: 24px;">
            <span style="font-size: 20px; font-weight: 900; text-transform: uppercase;">HEAVYWEIGHT</span>
            <span style="font-size: 11px; font-weight: bold; background: #31EF07; color: #1B0E0D; padding: 4px 8px; margin-left: 8px;">ORDER CONFIRMED</span>
          </div>
          <p>Greetings <strong>${safeName}</strong>,</p>
          <p>Order Reference: <strong>${safeReference}</strong></p>
          <p>Total Paid: <strong>${escapeHtml(totalFormatted)}</strong></p>
          <p style="color: #31EF07; font-weight: bold; background: #1B0E0D; padding: 8px 12px; display: inline-block;">STATUS: ALLOCATED // IN PREPARATION</p>
        </div>
      </body>
      </html>
    `;

    return this.dispatch(to, subject, text, html);
  }

  async sendShippingUpdateEmail(
    to: string,
    name: string,
    tracking: { orderReference: string; carrier: string; trackingNumber: string }
  ): Promise<EmailDispatchResult> {
    const safeName = escapeHtml(name);
    const safeRef = escapeHtml(tracking.orderReference);
    const safeCarrier = escapeHtml(tracking.carrier);
    const safeTracking = escapeHtml(tracking.trackingNumber);
    const subject = `HEAVYWEIGHT // Dispatched: ${tracking.orderReference}`;

    const text = [
      `HEAVYWEIGHT — SEASON 04`,
      `=======================`,
      `SHIPMENT DISPATCH NOTICE`,
      ``,
      `GREETINGS ${name.toUpperCase()},`,
      ``,
      `Order Reference: ${tracking.orderReference}`,
      `Logistics Partner: ${tracking.carrier}`,
      `Consignment Waybill: ${tracking.trackingNumber}`,
      ``,
      `Your shipment has departed the atelier. Real-time carrier tracking is active.`,
      ``,
      `ALGIONS AI LABS // FULFILLMENT NETWORK`,
    ].join('\n');

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 24px; background-color: #E3E2DE; font-family: monospace; color: #1B0E0D;">
        <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 2px solid #1B0E0D; padding: 32px;">
          <h2>HEAVYWEIGHT // Consignment En Route</h2>
          <p>Greetings <strong>${safeName}</strong>,</p>
          <p>Order Reference: <strong>${safeRef}</strong></p>
          <p>Carrier: <strong>${safeCarrier}</strong></p>
          <p>Tracking / Waybill: <strong>${safeTracking}</strong></p>
        </div>
      </body>
      </html>
    `;

    return this.dispatch(to, subject, text, html);
  }

  async sendReturnUpdateEmail(
    to: string,
    name: string,
    returnInfo: { returnId: string; status: string; reason: string }
  ): Promise<EmailDispatchResult> {
    const safeName = escapeHtml(name);
    const safeId = escapeHtml(returnInfo.returnId);
    const safeStatus = escapeHtml(returnInfo.status);
    const safeReason = escapeHtml(returnInfo.reason);
    const subject = `HEAVYWEIGHT // Return Request Update: ${returnInfo.returnId}`;

    const text = `Greetings ${name},\n\nYour return request ${returnInfo.returnId} status is: ${returnInfo.status}.\nReason: ${returnInfo.reason}`;
    const html = `
      <div style="font-family: monospace; background: #E3E2DE; color: #1B0E0D; padding: 24px; border: 2px solid #1B0E0D;">
        <h2>HEAVYWEIGHT // Return Status Update</h2>
        <p>Greetings <strong>${safeName}</strong>,</p>
        <p>Return ID: <strong>${safeId}</strong></p>
        <p>Current Status: <strong>${safeStatus}</strong></p>
        <p>Reason: <strong>${safeReason}</strong></p>
      </div>
    `;
    return this.dispatch(to, subject, text, html);
  }

  async sendRefundUpdateEmail(
    to: string,
    name: string,
    refundInfo: { refundId: string; amountCents: number; currency: string; status: string }
  ): Promise<EmailDispatchResult> {
    const safeName = escapeHtml(name);
    const safeId = escapeHtml(refundInfo.refundId);
    const safeStatus = escapeHtml(refundInfo.status);
    const amountFormatted = (refundInfo.amountCents / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: refundInfo.currency || 'INR',
    });
    const subject = `HEAVYWEIGHT // Settlement Notification: ${refundInfo.refundId}`;

    const text = `Greetings ${name},\n\nSettlement ${refundInfo.refundId} of ${amountFormatted} status: ${refundInfo.status}.`;
    const html = `
      <div style="font-family: monospace; background: #E3E2DE; color: #1B0E0D; padding: 24px; border: 2px solid #1B0E0D;">
        <h2>HEAVYWEIGHT // Financial Settlement</h2>
        <p>Greetings <strong>${safeName}</strong>,</p>
        <p>Refund ID: <strong>${safeId}</strong></p>
        <p>Settled Amount: <strong>${escapeHtml(amountFormatted)}</strong></p>
        <p>Status: <strong>${safeStatus}</strong></p>
      </div>
    `;
    return this.dispatch(to, subject, text, html);
  }
}

export const emailService = new EmailService();
