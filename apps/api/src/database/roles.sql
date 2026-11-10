-- ==============================================================================
-- Algions Platform — Database Least-Privilege Role Architecture
-- Separates DDL schema administration, runtime DML, and read-only backups.
-- ==============================================================================

-- 1. Migration / Schema Admin Role (Full DDL & Migration Privileges)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'algions_admin') THEN
        CREATE ROLE algions_admin WITH LOGIN PASSWORD 'change_in_production_admin_pass';
    END IF;
END $$;

-- 2. Runtime Application Role (Least-Privilege DML Only, No DDL, No Audit Tampering)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'algions_app') THEN
        CREATE ROLE algions_app WITH LOGIN PASSWORD 'change_in_production_app_pass';
    END IF;
END $$;

-- 3. Read-Only Backup Role (Dedicated to pg_dump routines)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'algions_backup') THEN
        CREATE ROLE algions_backup WITH LOGIN PASSWORD 'change_in_production_backup_pass';
    END IF;
END $$;

-- Grant Schema Usages
GRANT USAGE ON SCHEMA public TO algions_admin, algions_app, algions_backup;

-- Privileges for algions_admin
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO algions_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO algions_admin;

-- Privileges for runtime algions_app:
-- Standard read/write on product, order, and idempotency tables
GRANT SELECT, INSERT, UPDATE ON TABLE products, orders, order_items, idempotency_keys TO algions_app;
GRANT SELECT ON TABLE admin_users TO algions_app;

-- Critical Security Policy: Application role can ONLY INSERT into audit_events (no UPDATE, no DELETE)
GRANT SELECT, INSERT ON TABLE audit_events TO algions_app;

-- Privileges for algions_backup: Read-only access to all public tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO algions_backup;

-- Set Default Privileges for future tables created by algions_admin
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO algions_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO algions_backup;
