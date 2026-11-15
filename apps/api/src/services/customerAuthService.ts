import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CustomerUserRepository, CustomerUser, CustomerPreferences, CustomerAddress } from '../repositories/customerUserRepository.js';
import {
  CustomerRegisterInput,
  CustomerLoginInput,
  CustomerPreferencesInput,
  CustomerAddressInput
} from '../validators/customerValidators.js';
import { emailService, EmailDispatchResult } from './emailService.js';
import { config } from '../config/index.js';
import { logger } from '../logging/logger.js';

export interface CustomerAuthResult {
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    is_verified: boolean;
    created_at: string;
  };
  preferences: CustomerPreferences | null;
  token: string;
  refreshToken: string;
  verificationToken?: string;
  email_delivery?: EmailDispatchResult;
}

export class CustomerAuthService {
  private userRepo: CustomerUserRepository;

  constructor(userRepo?: CustomerUserRepository) {
    this.userRepo = userRepo || new CustomerUserRepository();
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  private generateAccessToken(user: { id: string; email: string }): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: 'CUSTOMER'
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN as any }
    );
  }

  private sanitizeUser(user: CustomerUser) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      is_verified: user.is_verified,
      created_at: user.created_at
    };
  }

  async register(
    input: CustomerRegisterInput,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<CustomerAuthResult> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      const err: any = new Error('An account with this email address already exists.');
      err.statusCode = 409;
      err.code = 'EMAIL_ALREADY_EXISTS';
      throw err;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    const user = await this.userRepo.createUser({
      email: input.email,
      password_hash: passwordHash,
      full_name: input.full_name,
      phone: input.phone
    });

    // Create default initial preferences
    const preferences = await this.userRepo.upsertPreferences(user.id, {
      gender_presentation: 'ALL',
      favorite_categories: [],
      preferred_styles: [],
      preferred_fits: [],
      preferred_sizes: [],
      preferred_colors: [],
      price_range_min_cents: 0,
      price_range_max_cents: 500000,
      onboarding_completed: false,
      newsletter_subscribed: false
    });

    // Create Email Verification Token (24h expiry)
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawVerificationToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.userRepo.createVerificationToken(user.id, tokenHash, expiresAt);

    // Deliver via configured email provider adapter
    const emailResult = await emailService.sendVerificationEmail(
      user.email,
      user.full_name,
      rawVerificationToken
    );

    // Create Session & Tokens
    const accessToken = this.generateAccessToken(user);
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.userRepo.createSession({
      user_id: user.id,
      refresh_token_hash: refreshTokenHash,
      expires_at: sessionExpiresAt,
      user_agent: meta?.userAgent,
      ip_address: meta?.ipAddress
    });

    const isProd = config.NODE_ENV === 'production';

    return {
      user: this.sanitizeUser(user),
      preferences,
      token: accessToken,
      refreshToken: rawRefreshToken,
      // Only include raw token preview in dev/test simulation
      verificationToken: isProd ? undefined : rawVerificationToken,
      email_delivery: emailResult
    };
  }

  async login(
    input: CustomerLoginInput,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<CustomerAuthResult> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      const err: any = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const isMatch = await bcrypt.compare(input.password, user.password_hash);
    if (!isMatch) {
      const err: any = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const accessToken = this.generateAccessToken(user);
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.userRepo.createSession({
      user_id: user.id,
      refresh_token_hash: refreshTokenHash,
      expires_at: sessionExpiresAt,
      user_agent: meta?.userAgent,
      ip_address: meta?.ipAddress
    });

    const preferences = await this.userRepo.getPreferences(user.id);

    return {
      user: this.sanitizeUser(user),
      preferences,
      token: accessToken,
      refreshToken: rawRefreshToken
    };
  }

  async logout(userId: string, refreshToken?: string): Promise<{ success: boolean; message: string }> {
    if (refreshToken) {
      const hash = this.hashToken(refreshToken);
      await this.userRepo.revokeSessionByTokenAndUser(userId, hash);
    } else {
      await this.userRepo.revokeAllUserSessions(userId);
    }
    return {
      success: true,
      message: 'Active session revoked successfully.'
    };
  }

  async rotateRefreshToken(
    rawRefreshToken: string,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ token: string; refreshToken: string; user: any }> {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      const err: any = new Error('Refresh token is required.');
      err.statusCode = 400;
      err.code = 'MISSING_REFRESH_TOKEN';
      throw err;
    }

    const oldHash = this.hashToken(rawRefreshToken);
    const session = await this.userRepo.findSessionByTokenHash(oldHash);

    if (!session) {
      const err: any = new Error('Invalid or non-existent refresh token.');
      err.statusCode = 401;
      err.code = 'INVALID_REFRESH_TOKEN';
      throw err;
    }

    // Reuse detection: If session was already revoked, someone is replaying a spent token!
    if (session.revoked_at) {
      logger.warn(
        { userId: session.user_id, sessionId: session.id },
        'SECURITY ALERT: Replay of revoked refresh token detected. Invaliding all user sessions immediately.'
      );
      await this.userRepo.revokeAllUserSessions(session.user_id);
      const err: any = new Error('Security policy violation: Refresh token reuse detected. All sessions revoked.');
      err.statusCode = 401;
      err.code = 'TOKEN_REUSE_DETECTED';
      throw err;
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      await this.userRepo.revokeSessionByTokenHash(oldHash);
      const err: any = new Error('Refresh token has expired. Please authenticate again.');
      err.statusCode = 401;
      err.code = 'REFRESH_TOKEN_EXPIRED';
      throw err;
    }

    const user = await this.userRepo.findById(session.user_id);
    if (!user) {
      const err: any = new Error('Customer account not found.');
      err.statusCode = 401;
      throw err;
    }

    // Invalidate old token (Single-use rotation)
    await this.userRepo.revokeSessionByTokenHash(oldHash);

    // Issue new token pair
    const newAccessToken = this.generateAccessToken(user);
    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newHash = this.hashToken(newRawRefreshToken);
    const newSessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.userRepo.createSession({
      user_id: user.id,
      refresh_token_hash: newHash,
      expires_at: newSessionExpiresAt,
      user_agent: meta?.userAgent,
      ip_address: meta?.ipAddress
    });

    return {
      token: newAccessToken,
      refreshToken: newRawRefreshToken,
      user: this.sanitizeUser(user)
    };
  }

  async verifyEmail(rawToken: string): Promise<{ success: boolean; message: string }> {
    const tokenHash = this.hashToken(rawToken);
    const record = await this.userRepo.findVerificationToken(tokenHash);

    if (!record) {
      const err: any = new Error('Invalid or expired verification token.');
      err.statusCode = 400;
      err.code = 'INVALID_TOKEN';
      throw err;
    }

    if (record.used_at) {
      const err: any = new Error('Verification token has already been used.');
      err.statusCode = 400;
      err.code = 'TOKEN_ALREADY_USED';
      throw err;
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      const err: any = new Error('Verification token has expired. Please request a new verification email.');
      err.statusCode = 400;
      err.code = 'TOKEN_EXPIRED';
      throw err;
    }

    await this.userRepo.markVerificationTokenUsed(record.id);
    await this.userRepo.markEmailVerified(record.user_id);

    return {
      success: true,
      message: 'Email address has been successfully verified.'
    };
  }

  async resendVerification(email: string): Promise<{ success: boolean; message: string; verificationToken?: string; email_delivery?: EmailDispatchResult }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user || user.is_verified) {
      return {
        success: true,
        message: 'If the account exists and is unverified, a new verification link has been dispatched.'
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.userRepo.createVerificationToken(user.id, tokenHash, expiresAt);

    const emailResult = await emailService.sendVerificationEmail(user.email, user.full_name, rawToken);
    const isProd = config.NODE_ENV === 'production';

    return {
      success: true,
      message: 'A new verification link has been dispatched to your email address.',
      verificationToken: isProd ? undefined : rawToken,
      email_delivery: emailResult
    };
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; resetToken?: string; email_delivery?: EmailDispatchResult }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      return {
        success: true,
        message: 'If an account with that email exists, password reset instructions have been dispatched.'
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.userRepo.createPasswordResetToken(user.id, tokenHash, expiresAt);

    const emailResult = await emailService.sendPasswordResetEmail(user.email, user.full_name, rawToken);
    const isProd = config.NODE_ENV === 'production';

    return {
      success: true,
      message: 'If an account with that email exists, password reset instructions have been dispatched.',
      // In production, resetToken is strictly omitted; in dev simulation it is provided for developer tests
      resetToken: isProd ? undefined : rawToken,
      email_delivery: emailResult
    };
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const tokenHash = this.hashToken(rawToken);
    const record = await this.userRepo.findPasswordResetToken(tokenHash);

    if (!record) {
      const err: any = new Error('Invalid or expired password reset token.');
      err.statusCode = 400;
      err.code = 'INVALID_TOKEN';
      throw err;
    }

    if (record.used_at) {
      const err: any = new Error('Password reset token has already been used.');
      err.statusCode = 400;
      err.code = 'TOKEN_ALREADY_USED';
      throw err;
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      const err: any = new Error('Password reset token has expired. Please request a new reset link.');
      err.statusCode = 400;
      err.code = 'TOKEN_EXPIRED';
      throw err;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.userRepo.updatePassword(record.user_id, passwordHash);
    await this.userRepo.revokeAllUserSessions(record.user_id);
    await this.userRepo.markPasswordResetTokenUsed(record.id);

    return {
      success: true,
      message: 'Password successfully updated. You may now log in with your new credentials.'
    };
  }

  // --- Profile & Preferences ---
  async getProfile(userId: string): Promise<any> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      const err: any = new Error('User profile not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, updates: { full_name?: string; phone?: string | null }): Promise<any> {
    const user = await this.userRepo.updateProfile(userId, updates);
    if (!user) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }
    return this.sanitizeUser(user);
  }

  async getPreferences(userId: string): Promise<CustomerPreferences> {
    const pref = await this.userRepo.getPreferences(userId);
    if (pref) return pref;

    // Auto-create default
    return await this.userRepo.upsertPreferences(userId, {
      gender_presentation: 'ALL',
      favorite_categories: [],
      preferred_styles: [],
      preferred_fits: [],
      preferred_sizes: [],
      preferred_colors: [],
      price_range_min_cents: 0,
      price_range_max_cents: 500000,
      onboarding_completed: false,
      newsletter_subscribed: false
    });
  }

  async updatePreferences(userId: string, input: CustomerPreferencesInput): Promise<CustomerPreferences> {
    return await this.userRepo.upsertPreferences(userId, {
      ...input,
      onboarding_completed: input.onboarding_completed ?? true
    });
  }

  // --- Address Book ---
  async getAddresses(userId: string): Promise<CustomerAddress[]> {
    return await this.userRepo.getAddresses(userId);
  }

  async addAddress(userId: string, input: CustomerAddressInput): Promise<CustomerAddress> {
    return await this.userRepo.addAddress(userId, {
      ...input,
      address_line2: input.address_line2 || null
    });
  }

  async updateAddress(userId: string, addressId: string, input: Partial<CustomerAddressInput>): Promise<CustomerAddress> {
    const updated = await this.userRepo.updateAddress(userId, addressId, input);
    if (!updated) {
      const err: any = new Error('Address not found or unauthorized.');
      err.statusCode = 404;
      throw err;
    }
    return updated;
  }

  async deleteAddress(userId: string, addressId: string): Promise<{ success: boolean }> {
    const deleted = await this.userRepo.deleteAddress(userId, addressId);
    if (!deleted) {
      const err: any = new Error('Address not found or unauthorized.');
      err.statusCode = 404;
      throw err;
    }
    return { success: true };
  }
}
