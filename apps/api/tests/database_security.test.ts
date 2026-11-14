import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Database Security & Least-Privilege Role Architecture', () => {
  const schemaSqlPath = path.resolve(__dirname, '../src/database/schema.sql');
  const rolesSqlPath = path.resolve(__dirname, '../src/database/roles.sql');

  const schemaSql = fs.readFileSync(schemaSqlPath, 'utf-8');
  const rolesSql = fs.readFileSync(rolesSqlPath, 'utf-8');

  it('enforces append-only immutability trigger on audit_events in schema.sql', () => {
    expect(schemaSql).toContain('CREATE OR REPLACE FUNCTION prevent_audit_tampering()');
    expect(schemaSql).toContain('RAISE EXCEPTION');
    expect(schemaSql).toContain('CREATE TRIGGER trg_audit_events_immutable');
    expect(schemaSql).toContain('BEFORE UPDATE OR DELETE ON audit_events');
  });

  it('defines separated roles for admin, runtime app, and backup in roles.sql', () => {
    expect(rolesSql).toContain('CREATE ROLE algions_admin');
    expect(rolesSql).toContain('CREATE ROLE algions_app');
    expect(rolesSql).toContain('CREATE ROLE algions_backup');
  });

  it('restricts runtime algions_app from performing UPDATE or DELETE on audit_events', () => {
    // Must grant only SELECT, INSERT on audit_events to algions_app
    expect(rolesSql).toContain('GRANT SELECT, INSERT ON TABLE audit_events TO algions_app;');
    expect(rolesSql).not.toContain('GRANT ALL PRIVILEGES ON TABLE audit_events TO algions_app');
    expect(rolesSql).not.toContain('GRANT UPDATE ON TABLE audit_events TO algions_app');
    expect(rolesSql).not.toContain('GRANT DELETE ON TABLE audit_events TO algions_app');
  });

  it('restricts algions_backup to read-only SELECT permissions', () => {
    expect(rolesSql).toContain('GRANT SELECT ON ALL TABLES IN SCHEMA public TO algions_backup;');
    expect(rolesSql).not.toContain('GRANT INSERT ON ALL TABLES IN SCHEMA public TO algions_backup');
    expect(rolesSql).not.toContain('GRANT UPDATE ON ALL TABLES IN SCHEMA public TO algions_backup');
    expect(rolesSql).not.toContain('GRANT DELETE ON ALL TABLES IN SCHEMA public TO algions_backup');
  });

  it('guarantees runtime app role does not have SUPERUSER privileges', () => {
    expect(rolesSql).not.toMatch(/CREATE ROLE algions_app.*SUPERUSER/i);
    expect(rolesSql).not.toMatch(/ALTER ROLE algions_app.*SUPERUSER/i);
  });

  it('revokes schema creation and DDL permissions from algions_app', () => {
    expect(rolesSql).toContain('REVOKE CREATE ON SCHEMA public FROM PUBLIC;');
    expect(rolesSql).toContain('REVOKE CREATE ON SCHEMA public FROM algions_app;');
    expect(rolesSql).not.toContain('GRANT CREATE ON SCHEMA public TO algions_app');
    expect(rolesSql).not.toContain('GRANT ALL PRIVILEGES ON SCHEMA public TO algions_app');
  });
});
