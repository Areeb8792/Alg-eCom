import { query } from '../database/connection.js';
import { IN_MEMORY_AUDIT_EVENTS } from '../database/inMemoryStore.js';
import { config } from '../config/index.js';
import bcrypt from 'bcryptjs';

export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  actor_id: string | null;
  actor_username: string;
  action: string;
  resource_type: string;
  resource_id: string;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  correlation_id: string | null;
  created_at: string;
}

export class AdminRepository {
  async findByUsername(username: string): Promise<AdminUser | null> {
    try {
      const res = await query<AdminUser>(
        `SELECT id, username, password_hash, role, created_at
         FROM admin_users
         WHERE username = $1;`,
        [username]
      );
      return res.rows[0] || null;
    } catch (err) {
      if (process.env.ALLOW_IN_MEMORY_FALLBACK === 'true' && config.NODE_ENV === 'development') {
        if (username === config.ADMIN_USERNAME) {
          const salt = bcrypt.genSaltSync(10);
          return {
            id: 'admin-fallback-uuid',
            username: config.ADMIN_USERNAME,
            password_hash: bcrypt.hashSync(config.ADMIN_PASSWORD, salt),
            role: 'ADMIN',
            created_at: new Date().toISOString()
          };
        }
        return null;
      }
      throw err;
    }
  }

  async createAuditEvent(event: {
    actorId?: string;
    actorUsername: string;
    action: string;
    resourceType: string;
    resourceId: string;
    beforeState?: Record<string, unknown> | null;
    afterState?: Record<string, unknown> | null;
    correlationId?: string;
  }): Promise<AuditEvent> {
    try {
      const res = await query<AuditEvent>(
        `INSERT INTO audit_events (actor_id, actor_username, action, resource_type, resource_id, before_state, after_state, correlation_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, actor_id, actor_username, action, resource_type, resource_id, before_state, after_state, correlation_id, created_at;`,
        [
          event.actorId || null,
          event.actorUsername,
          event.action,
          event.resourceType,
          event.resourceId,
          event.beforeState ? JSON.stringify(event.beforeState) : null,
          event.afterState ? JSON.stringify(event.afterState) : null,
          event.correlationId || null
        ]
      );
      return res.rows[0];
    } catch (err) {
      if (process.env.ALLOW_IN_MEMORY_FALLBACK === 'true' && config.NODE_ENV === 'development') {
        const item: AuditEvent = {
          id: `audit-${Date.now()}`,
          actor_id: event.actorId || null,
          actor_username: event.actorUsername,
          action: event.action,
          resource_type: event.resourceType,
          resource_id: event.resourceId,
          before_state: event.beforeState || null,
          after_state: event.afterState || null,
          correlation_id: event.correlationId || null,
          created_at: new Date().toISOString()
        };
        IN_MEMORY_AUDIT_EVENTS.unshift(item);
        return item;
      }
      throw err;
    }
  }

  async getRecentAuditEvents(limit = 50): Promise<AuditEvent[]> {
    try {
      const res = await query<AuditEvent>(
        `SELECT id, actor_id, actor_username, action, resource_type, resource_id, before_state, after_state, correlation_id, created_at
         FROM audit_events
         ORDER BY created_at DESC
         LIMIT $1;`,
        [limit]
      );
      return res.rows;
    } catch (err) {
      if (process.env.ALLOW_IN_MEMORY_FALLBACK === 'true' && config.NODE_ENV === 'development') {
        return IN_MEMORY_AUDIT_EVENTS.slice(0, limit);
      }
      throw err;
    }
  }
}
