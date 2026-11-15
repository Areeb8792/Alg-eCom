import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection.js';
import {
  IN_MEMORY_USERS,
  IN_MEMORY_USER_SESSIONS,
  IN_MEMORY_VERIFICATION_TOKENS,
  IN_MEMORY_PASSWORD_RESET_TOKENS,
  IN_MEMORY_PREFERENCES,
  IN_MEMORY_ADDRESSES,
  InMemoryCustomerUser,
  InMemoryUserSession,
  InMemoryVerificationToken,
  InMemoryPasswordResetToken,
  InMemoryCustomerPreferences,
  InMemoryCustomerAddress
} from '../database/inMemoryStore.js';
import { config } from '../config/index.js';
import { logger } from '../logging/logger.js';

export interface CustomerUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  is_verified: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerPreferences {
  user_id: string;
  gender_presentation: string;
  favorite_categories: string[];
  preferred_styles: string[];
  preferred_fits: string[];
  preferred_sizes: string[];
  preferred_colors: string[];
  price_range_min_cents: number;
  price_range_max_cents: number;
  onboarding_completed: boolean;
  newsletter_subscribed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  created_at: string;
  updated_at: string;
}

export class CustomerUserRepository {
  private static isDbAvailable: boolean | null = null;

  private shouldUseMemoryFallback(err?: any): boolean {
    const isAllowed =
      process.env.ALLOW_IN_MEMORY_FALLBACK === 'true' ||
      config.NODE_ENV === 'test' ||
      config.NODE_ENV === 'development';
    if (!isAllowed) return false;
    if (err && err.code === '23505') return false;
    if (err && (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT')) {
      CustomerUserRepository.isDbAvailable = false;
    }
    return true;
  }

  private isDbDirectFallback(): boolean {
    return (
      (process.env.ALLOW_IN_MEMORY_FALLBACK === 'true' || config.NODE_ENV === 'test') &&
      CustomerUserRepository.isDbAvailable === false
    );
  }

  // --- Users ---
  async createUser(data: {
    email: string;
    password_hash: string;
    full_name: string;
    phone?: string | null;
  }): Promise<CustomerUser> {
    if (this.isDbDirectFallback()) {
      return this.createUserInMemory(data);
    }
    try {
      const sql = `
        INSERT INTO users (email, password_hash, full_name, phone)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, password_hash, full_name, phone, is_verified, email_verified_at, created_at, updated_at;
      `;
      const res = await query<CustomerUser>(sql, [
        data.email.toLowerCase().trim(),
        data.password_hash,
        data.full_name.trim(),
        data.phone || null
      ]);
      return res.rows[0];
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        return this.createUserInMemory(data);
      }
      throw err;
    }
  }

  private createUserInMemory(data: {
    email: string;
    password_hash: string;
    full_name: string;
    phone?: string | null;
  }): CustomerUser {
    for (const existing of IN_MEMORY_USERS.values()) {
      if (existing.email.toLowerCase() === data.email.toLowerCase().trim()) {
        const error: any = new Error('User with this email already exists');
        error.code = '23505';
        throw error;
      }
    }
    const user: InMemoryCustomerUser = {
      id: uuidv4(),
      email: data.email.toLowerCase().trim(),
      password_hash: data.password_hash,
      full_name: data.full_name.trim(),
      phone: data.phone || null,
      is_verified: false,
      email_verified_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    IN_MEMORY_USERS.set(user.id, user);
    return user;
  }

  async findByEmail(email: string): Promise<CustomerUser | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (this.isDbDirectFallback()) {
      return this.findByEmailInMemory(cleanEmail);
    }
    try {
      const sql = `
        SELECT id, email, password_hash, full_name, phone, is_verified, email_verified_at, created_at, updated_at
        FROM users
        WHERE LOWER(email) = $1;
      `;
      const res = await query<CustomerUser>(sql, [cleanEmail]);
      return res.rows[0] || null;
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        return this.findByEmailInMemory(cleanEmail);
      }
      throw err;
    }
  }

  private findByEmailInMemory(cleanEmail: string): CustomerUser | null {
    for (const user of IN_MEMORY_USERS.values()) {
      if (user.email.toLowerCase() === cleanEmail) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<CustomerUser | null> {
    if (this.isDbDirectFallback()) {
      return IN_MEMORY_USERS.get(id) || null;
    }
    try {
      const sql = `
        SELECT id, email, password_hash, full_name, phone, is_verified, email_verified_at, created_at, updated_at
        FROM users
        WHERE id = $1;
      `;
      const res = await query<CustomerUser>(sql, [id]);
      return res.rows[0] || null;
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        return IN_MEMORY_USERS.get(id) || null;
      }
      throw err;
    }
  }

  async updateProfile(id: string, updates: { full_name?: string; phone?: string | null }): Promise<CustomerUser | null> {
    if (this.isDbDirectFallback()) {
      return this.updateProfileInMemory(id, updates);
    }
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (updates.full_name !== undefined) {
        fields.push(`full_name = $${idx++}`);
        values.push(updates.full_name);
      }
      if (updates.phone !== undefined) {
        fields.push(`phone = $${idx++}`);
        values.push(updates.phone);
      }
      fields.push(`updated_at = NOW()`);

      values.push(id);
      const sql = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${idx}
        RETURNING id, email, password_hash, full_name, phone, is_verified, email_verified_at, created_at, updated_at;
      `;
      const res = await query<CustomerUser>(sql, values);
      return res.rows[0] || null;
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        return this.updateProfileInMemory(id, updates);
      }
      throw err;
    }
  }

  private updateProfileInMemory(id: string, updates: { full_name?: string; phone?: string | null }): CustomerUser | null {
    const user = IN_MEMORY_USERS.get(id);
    if (!user) return null;
    if (updates.full_name !== undefined) user.full_name = updates.full_name;
    if (updates.phone !== undefined) user.phone = updates.phone;
    user.updated_at = new Date().toISOString();
    return user;
  }

  async markEmailVerified(userId: string): Promise<void> {
    if (this.isDbDirectFallback()) {
      const user = IN_MEMORY_USERS.get(userId);
      if (user) {
        user.is_verified = true;
        user.email_verified_at = new Date().toISOString();
        user.updated_at = new Date().toISOString();
      }
      return;
    }
    try {
      const sql = `
        UPDATE users
        SET is_verified = TRUE, email_verified_at = NOW(), updated_at = NOW()
        WHERE id = $1;
      `;
      await query(sql, [userId]);
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        const user = IN_MEMORY_USERS.get(userId);
        if (user) {
          user.is_verified = true;
          user.email_verified_at = new Date().toISOString();
          user.updated_at = new Date().toISOString();
        }
        return;
      }
      throw err;
    }
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    if (this.isDbDirectFallback()) {
      const user = IN_MEMORY_USERS.get(userId);
      if (user) {
        user.password_hash = passwordHash;
        user.updated_at = new Date().toISOString();
      }
      return;
    }
    try {
      const sql = `
        UPDATE users
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2;
      `;
      await query(sql, [passwordHash, userId]);
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        const user = IN_MEMORY_USERS.get(userId);
        if (user) {
          user.password_hash = passwordHash;
          user.updated_at = new Date().toISOString();
        }
        return;
      }
      throw err;
    }
  }

  // --- Sessions ---
  async createSession(data: {
    user_id: string;
    refresh_token_hash: string;
    expires_at: Date;
    user_agent?: string;
    ip_address?: string;
  }): Promise<void> {
    if (this.isDbDirectFallback()) {
      const session: InMemoryUserSession = {
        id: uuidv4(),
        user_id: data.user_id,
        refresh_token_hash: data.refresh_token_hash,
        user_agent: data.user_agent || null,
        ip_address: data.ip_address || null,
        expires_at: data.expires_at.toISOString(),
        revoked_at: null,
        created_at: new Date().toISOString()
      };
      IN_MEMORY_USER_SESSIONS.set(session.id, session);
      return;
    }
    try {
      const sql = `
        INSERT INTO user_sessions (user_id, refresh_token_hash, expires_at, user_agent, ip_address)
        VALUES ($1, $2, $3, $4, $5);
      `;
      await query(sql, [
        data.user_id,
        data.refresh_token_hash,
        data.expires_at,
        data.user_agent || null,
        data.ip_address || null
      ]);
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        const session: InMemoryUserSession = {
          id: uuidv4(),
          user_id: data.user_id,
          refresh_token_hash: data.refresh_token_hash,
          user_agent: data.user_agent || null,
          ip_address: data.ip_address || null,
          expires_at: data.expires_at.toISOString(),
          revoked_at: null,
          created_at: new Date().toISOString()
        };
        IN_MEMORY_USER_SESSIONS.set(session.id, session);
        return;
      }
      throw err;
    }
  }

  async revokeSessionByTokenHash(refreshTokenHash: string): Promise<void> {
    if (this.isDbDirectFallback()) {
      for (const session of IN_MEMORY_USER_SESSIONS.values()) {
        if (session.refresh_token_hash === refreshTokenHash) {
          session.revoked_at = new Date().toISOString();
        }
      }
      return;
    }
    try {
      const sql = `
        UPDATE user_sessions
        SET revoked_at = NOW()
        WHERE refresh_token_hash = $1;
      `;
      await query(sql, [refreshTokenHash]);
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        for (const session of IN_MEMORY_USER_SESSIONS.values()) {
          if (session.refresh_token_hash === refreshTokenHash) {
            session.revoked_at = new Date().toISOString();
          }
        }
        return;
      }
      throw err;
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    if (this.isDbDirectFallback()) {
      for (const session of IN_MEMORY_USER_SESSIONS.values()) {
        if (session.user_id === userId && !session.revoked_at) {
          session.revoked_at = new Date().toISOString();
        }
      }
      return;
    }
    try {
      const sql = `
        UPDATE user_sessions
        SET revoked_at = NOW()
        WHERE user_id = $1 AND revoked_at IS NULL;
      `;
      await query(sql, [userId]);
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        for (const session of IN_MEMORY_USER_SESSIONS.values()) {
          if (session.user_id === userId && !session.revoked_at) {
            session.revoked_at = new Date().toISOString();
          }
        }
        return;
      }
      throw err;
    }
  }

  // --- Verification Tokens ---
  async createVerificationToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    if (this.isDbDirectFallback()) {
      const token: InMemoryVerificationToken = {
        id: uuidv4(),
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        used_at: null,
        created_at: new Date().toISOString()
      };
      IN_MEMORY_VERIFICATION_TOKENS.set(token.id, token);
      return;
    }
    try {
      const sql = `
        INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3);
      `;
      await query(sql, [userId, tokenHash, expiresAt]);
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        const token: InMemoryVerificationToken = {
          id: uuidv4(),
          user_id: userId,
          token_hash: tokenHash,
          expires_at: expiresAt.toISOString(),
          used_at: null,
          created_at: new Date().toISOString()
        };
        IN_MEMORY_VERIFICATION_TOKENS.set(token.id, token);
        return;
      }
      throw err;
    }
  }

  async findVerificationToken(tokenHash: string): Promise<{ id: string; user_id: string; expires_at: string; used_at: string | null } | null> {
    if (this.isDbDirectFallback()) {
      for (const item of IN_MEMORY_VERIFICATION_TOKENS.values()) {
        if (item.token_hash === tokenHash) return item;
      }
      return null;
    }
    try {
      const sql = `
        SELECT id, user_id, expires_at, used_at
        FROM email_verification_tokens
        WHERE token_hash = $1;
      `;
      const res = await query<{ id: string; user_id: string; expires_at: string; used_at: string | null }>(sql, [tokenHash]);
      return res.rows[0] || null;
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        for (const item of IN_MEMORY_VERIFICATION_TOKENS.values()) {
          if (item.token_hash === tokenHash) return item;
        }
        return null;
      }
      throw err;
    }
  }

  async markVerificationTokenUsed(tokenId: string): Promise<void> {
    if (this.isDbDirectFallback()) {
      const token = IN_MEMORY_VERIFICATION_TOKENS.get(tokenId);
      if (token) token.used_at = new Date().toISOString();
      return;
    }
    try {
      const sql = `
        UPDATE email_verification_tokens
        SET used_at = NOW()
        WHERE id = $1;
      `;
      await query(sql, [tokenId]);
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        const token = IN_MEMORY_VERIFICATION_TOKENS.get(tokenId);
        if (token) token.used_at = new Date().toISOString();
        return;
      }
      throw err;
    }
  }

  // --- Password Reset Tokens ---
  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    if (this.isDbDirectFallback()) {
      const token: InMemoryPasswordResetToken = {
        id: uuidv4(),
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        used_at: null,
        created_at: new Date().toISOString()
      };
      IN_MEMORY_PASSWORD_RESET_TOKENS.set(token.id, token);
      return;
    }
    try {
      const sql = `
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3);
      `;
      await query(sql, [userId, tokenHash, expiresAt]);
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        const token: InMemoryPasswordResetToken = {
          id: uuidv4(),
          user_id: userId,
          token_hash: tokenHash,
          expires_at: expiresAt.toISOString(),
          used_at: null,
          created_at: new Date().toISOString()
        };
        IN_MEMORY_PASSWORD_RESET_TOKENS.set(token.id, token);
        return;
      }
      throw err;
    }
  }

  async findPasswordResetToken(tokenHash: string): Promise<{ id: string; user_id: string; expires_at: string; used_at: string | null } | null> {
    if (this.isDbDirectFallback()) {
      for (const item of IN_MEMORY_PASSWORD_RESET_TOKENS.values()) {
        if (item.token_hash === tokenHash) return item;
      }
      return null;
    }
    try {
      const sql = `
        SELECT id, user_id, expires_at, used_at
        FROM password_reset_tokens
        WHERE token_hash = $1;
      `;
      const res = await query<{ id: string; user_id: string; expires_at: string; used_at: string | null }>(sql, [tokenHash]);
      return res.rows[0] || null;
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        for (const item of IN_MEMORY_PASSWORD_RESET_TOKENS.values()) {
          if (item.token_hash === tokenHash) return item;
        }
        return null;
      }
      throw err;
    }
  }

  async markPasswordResetTokenUsed(tokenId: string): Promise<void> {
    if (this.isDbDirectFallback()) {
      const token = IN_MEMORY_PASSWORD_RESET_TOKENS.get(tokenId);
      if (token) token.used_at = new Date().toISOString();
      return;
    }
    try {
      const sql = `
        UPDATE password_reset_tokens
        SET used_at = NOW()
        WHERE id = $1;
      `;
      await query(sql, [tokenId]);
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        const token = IN_MEMORY_PASSWORD_RESET_TOKENS.get(tokenId);
        if (token) token.used_at = new Date().toISOString();
        return;
      }
      throw err;
    }
  }

  // --- Customer Preferences ---
  async getPreferences(userId: string): Promise<CustomerPreferences | null> {
    if (this.isDbDirectFallback()) {
      return IN_MEMORY_PREFERENCES.get(userId) || null;
    }
    try {
      const sql = `
        SELECT user_id, gender_presentation, favorite_categories, preferred_styles,
               preferred_fits, preferred_sizes, preferred_colors, price_range_min_cents,
               price_range_max_cents, onboarding_completed, newsletter_subscribed,
               created_at, updated_at
        FROM customer_preferences
        WHERE user_id = $1;
      `;
      const res = await query<CustomerPreferences>(sql, [userId]);
      return res.rows[0] || null;
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        return IN_MEMORY_PREFERENCES.get(userId) || null;
      }
      throw err;
    }
  }

  async upsertPreferences(
    userId: string,
    data: Partial<Omit<CustomerPreferences, 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<CustomerPreferences> {
    if (this.isDbDirectFallback()) {
      return this.upsertPreferencesInMemory(userId, data);
    }
    try {
      const existing = await this.getPreferences(userId);
      const gender = data.gender_presentation ?? existing?.gender_presentation ?? 'ALL';
      const categories = data.favorite_categories ?? existing?.favorite_categories ?? [];
      const styles = data.preferred_styles ?? existing?.preferred_styles ?? [];
      const fits = data.preferred_fits ?? existing?.preferred_fits ?? [];
      const sizes = data.preferred_sizes ?? existing?.preferred_sizes ?? [];
      const colors = data.preferred_colors ?? existing?.preferred_colors ?? [];
      const minPrice = data.price_range_min_cents ?? existing?.price_range_min_cents ?? 0;
      const maxPrice = data.price_range_max_cents ?? existing?.price_range_max_cents ?? 500000;
      const completed = data.onboarding_completed ?? existing?.onboarding_completed ?? false;
      const newsletter = data.newsletter_subscribed ?? existing?.newsletter_subscribed ?? false;

      const sql = `
        INSERT INTO customer_preferences (
          user_id, gender_presentation, favorite_categories, preferred_styles,
          preferred_fits, preferred_sizes, preferred_colors, price_range_min_cents,
          price_range_max_cents, onboarding_completed, newsletter_subscribed, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          gender_presentation = EXCLUDED.gender_presentation,
          favorite_categories = EXCLUDED.favorite_categories,
          preferred_styles = EXCLUDED.preferred_styles,
          preferred_fits = EXCLUDED.preferred_fits,
          preferred_sizes = EXCLUDED.preferred_sizes,
          preferred_colors = EXCLUDED.preferred_colors,
          price_range_min_cents = EXCLUDED.price_range_min_cents,
          price_range_max_cents = EXCLUDED.price_range_max_cents,
          onboarding_completed = EXCLUDED.onboarding_completed,
          newsletter_subscribed = EXCLUDED.newsletter_subscribed,
          updated_at = NOW()
        RETURNING user_id, gender_presentation, favorite_categories, preferred_styles,
                  preferred_fits, preferred_sizes, preferred_colors, price_range_min_cents,
                  price_range_max_cents, onboarding_completed, newsletter_subscribed,
                  created_at, updated_at;
      `;
      const res = await query<CustomerPreferences>(sql, [
        userId,
        gender,
        categories,
        styles,
        fits,
        sizes,
        colors,
        minPrice,
        maxPrice,
        completed,
        newsletter
      ]);
      return res.rows[0];
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        return this.upsertPreferencesInMemory(userId, data);
      }
      throw err;
    }
  }

  private upsertPreferencesInMemory(
    userId: string,
    data: Partial<Omit<CustomerPreferences, 'user_id' | 'created_at' | 'updated_at'>>
  ): CustomerPreferences {
    const existing = IN_MEMORY_PREFERENCES.get(userId);
    const updated: InMemoryCustomerPreferences = {
      user_id: userId,
      gender_presentation: data.gender_presentation ?? existing?.gender_presentation ?? 'ALL',
      favorite_categories: data.favorite_categories ?? existing?.favorite_categories ?? [],
      preferred_styles: data.preferred_styles ?? existing?.preferred_styles ?? [],
      preferred_fits: data.preferred_fits ?? existing?.preferred_fits ?? [],
      preferred_sizes: data.preferred_sizes ?? existing?.preferred_sizes ?? [],
      preferred_colors: data.preferred_colors ?? existing?.preferred_colors ?? [],
      price_range_min_cents: data.price_range_min_cents ?? existing?.price_range_min_cents ?? 0,
      price_range_max_cents: data.price_range_max_cents ?? existing?.price_range_max_cents ?? 500000,
      onboarding_completed: data.onboarding_completed ?? existing?.onboarding_completed ?? false,
      newsletter_subscribed: data.newsletter_subscribed ?? existing?.newsletter_subscribed ?? false,
      created_at: existing?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    IN_MEMORY_PREFERENCES.set(userId, updated);
    return updated;
  }

  // --- Customer Addresses ---
  async getAddresses(userId: string): Promise<CustomerAddress[]> {
    if (this.isDbDirectFallback()) {
      return this.getAddressesInMemory(userId);
    }
    try {
      const sql = `
        SELECT id, user_id, label, recipient_name, phone, address_line1, address_line2,
               city, state_province, postal_code, country_code, is_default_shipping,
               is_default_billing, created_at, updated_at
        FROM customer_addresses
        WHERE user_id = $1
        ORDER BY is_default_shipping DESC, created_at DESC;
      `;
      const res = await query<CustomerAddress>(sql, [userId]);
      return res.rows;
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        return this.getAddressesInMemory(userId);
      }
      throw err;
    }
  }

  private getAddressesInMemory(userId: string): CustomerAddress[] {
    const addresses: InMemoryCustomerAddress[] = [];
    for (const addr of IN_MEMORY_ADDRESSES.values()) {
      if (addr.user_id === userId) addresses.push(addr);
    }
    return addresses.sort((a, b) => (b.is_default_shipping ? 1 : 0) - (a.is_default_shipping ? 1 : 0));
  }

  async addAddress(userId: string, data: Omit<CustomerAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<CustomerAddress> {
    if (this.isDbDirectFallback()) {
      return this.addAddressInMemory(userId, data);
    }
    try {
      if (data.is_default_shipping) {
        await query(`UPDATE customer_addresses SET is_default_shipping = FALSE WHERE user_id = $1;`, [userId]);
      }
      if (data.is_default_billing) {
        await query(`UPDATE customer_addresses SET is_default_billing = FALSE WHERE user_id = $1;`, [userId]);
      }

      const sql = `
        INSERT INTO customer_addresses (
          user_id, label, recipient_name, phone, address_line1, address_line2,
          city, state_province, postal_code, country_code, is_default_shipping, is_default_billing
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, user_id, label, recipient_name, phone, address_line1, address_line2,
                  city, state_province, postal_code, country_code, is_default_shipping,
                  is_default_billing, created_at, updated_at;
      `;
      const res = await query<CustomerAddress>(sql, [
        userId,
        data.label,
        data.recipient_name,
        data.phone,
        data.address_line1,
        data.address_line2 || null,
        data.city,
        data.state_province,
        data.postal_code,
        data.country_code,
        data.is_default_shipping,
        data.is_default_billing
      ]);
      return res.rows[0];
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        return this.addAddressInMemory(userId, data);
      }
      throw err;
    }
  }

  private addAddressInMemory(userId: string, data: Omit<CustomerAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>): CustomerAddress {
    if (data.is_default_shipping) {
      for (const addr of IN_MEMORY_ADDRESSES.values()) {
        if (addr.user_id === userId) addr.is_default_shipping = false;
      }
    }
    if (data.is_default_billing) {
      for (const addr of IN_MEMORY_ADDRESSES.values()) {
        if (addr.user_id === userId) addr.is_default_billing = false;
      }
    }
    const address: InMemoryCustomerAddress = {
      id: uuidv4(),
      user_id: userId,
      label: data.label,
      recipient_name: data.recipient_name,
      phone: data.phone,
      address_line1: data.address_line1,
      address_line2: data.address_line2 || null,
      city: data.city,
      state_province: data.state_province,
      postal_code: data.postal_code,
      country_code: data.country_code,
      is_default_shipping: data.is_default_shipping,
      is_default_billing: data.is_default_billing,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    IN_MEMORY_ADDRESSES.set(address.id, address);
    return address;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    data: Partial<Omit<CustomerAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<CustomerAddress | null> {
    if (this.isDbDirectFallback()) {
      return this.updateAddressInMemory(userId, addressId, data);
    }
    try {
      if (data.is_default_shipping) {
        await query(`UPDATE customer_addresses SET is_default_shipping = FALSE WHERE user_id = $1 AND id != $2;`, [userId, addressId]);
      }
      if (data.is_default_billing) {
        await query(`UPDATE customer_addresses SET is_default_billing = FALSE WHERE user_id = $1 AND id != $2;`, [userId, addressId]);
      }

      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, val] of Object.entries(data)) {
        if (val !== undefined) {
          fields.push(`${key} = $${idx++}`);
          values.push(val);
        }
      }
      fields.push(`updated_at = NOW()`);

      values.push(addressId, userId);
      const sql = `
        UPDATE customer_addresses
        SET ${fields.join(', ')}
        WHERE id = $${idx++} AND user_id = $${idx++}
        RETURNING id, user_id, label, recipient_name, phone, address_line1, address_line2,
                  city, state_province, postal_code, country_code, is_default_shipping,
                  is_default_billing, created_at, updated_at;
      `;
      const res = await query<CustomerAddress>(sql, values);
      return res.rows[0] || null;
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        return this.updateAddressInMemory(userId, addressId, data);
      }
      throw err;
    }
  }

  private updateAddressInMemory(
    userId: string,
    addressId: string,
    data: Partial<Omit<CustomerAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): CustomerAddress | null {
    const address = IN_MEMORY_ADDRESSES.get(addressId);
    if (!address || address.user_id !== userId) return null;
    if (data.is_default_shipping) {
      for (const addr of IN_MEMORY_ADDRESSES.values()) {
        if (addr.user_id === userId && addr.id !== addressId) addr.is_default_shipping = false;
      }
    }
    if (data.is_default_billing) {
      for (const addr of IN_MEMORY_ADDRESSES.values()) {
        if (addr.user_id === userId && addr.id !== addressId) addr.is_default_billing = false;
      }
    }
    Object.assign(address, data, { updated_at: new Date().toISOString() });
    return address;
  }

  async deleteAddress(userId: string, addressId: string): Promise<boolean> {
    if (this.isDbDirectFallback()) {
      const address = IN_MEMORY_ADDRESSES.get(addressId);
      if (address && address.user_id === userId) {
        IN_MEMORY_ADDRESSES.delete(addressId);
        return true;
      }
      return false;
    }
    try {
      const sql = `DELETE FROM customer_addresses WHERE id = $1 AND user_id = $2;`;
      const res = await query(sql, [addressId, userId]);
      return (res.rowCount ?? 0) > 0;
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        const address = IN_MEMORY_ADDRESSES.get(addressId);
        if (address && address.user_id === userId) {
          IN_MEMORY_ADDRESSES.delete(addressId);
          return true;
        }
        return false;
      }
      throw err;
    }
  }
}
