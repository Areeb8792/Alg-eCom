import { query } from '../database/connection.js';

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
    const res = await query<AdminUser>(
      `SELECT id, username, password_hash, role, created_at
       FROM admin_users
       WHERE username = $1;`,
      [username]
    );
    return res.rows[0] || null;
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
  }

  async getRecentAuditEvents(limit = 50): Promise<AuditEvent[]> {
    const res = await query<AuditEvent>(
      `SELECT id, actor_id, actor_username, action, resource_type, resource_id, before_state, after_state, correlation_id, created_at
       FROM audit_events
       ORDER BY created_at DESC
       LIMIT $1;`,
      [limit]
    );
    return res.rows;
  }
}
