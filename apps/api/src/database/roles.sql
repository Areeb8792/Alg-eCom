-- ==============================================================================
-- Algions Platform — Database Least-Privilege Role Architecture
-- Separates bootstrap admin, DDL migrations, runtime DML, and read-only backups.
-- ==============================================================================

-- 1. Migration / Schema Admin Role (Full DDL & Migration Privileges)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'algions_admin') THEN
        CREATE ROLE algions_admin WITH LOGIN PASSWORD 'algions_admin_password';
    ELSE
        ALTER ROLE algions_admin WITH LOGIN PASSWORD 'algions_admin_password';
    END IF;
END $$;

-- 2. Runtime Application Role (Least-Privilege DML Only, No DDL, No Role Administration, No Audit Tampering)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'algions_app') THEN
        CREATE ROLE algions_app WITH LOGIN PASSWORD 'algions_app_password' NOCREATEDB NOCREATEROLE NOINHERIT;
    ELSE
        ALTER ROLE algions_app WITH LOGIN PASSWORD 'algions_app_password' NOCREATEDB NOCREATEROLE NOINHERIT;
    END IF;
END $$;

-- 3. Read-Only Backup Role (Dedicated to pg_dump routines, No DDL, No DML modification)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'algions_backup') THEN
        CREATE ROLE algions_backup WITH LOGIN PASSWORD 'algions_backup_password' NOCREATEDB NOCREATEROLE NOINHERIT;
    ELSE
        ALTER ROLE algions_backup WITH LOGIN PASSWORD 'algions_backup_password' NOCREATEDB NOCREATEROLE NOINHERIT;
    END IF;
END $$;

-- Revoke default public schema creation to enforce least-privilege boundary
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- Grant Schema Usages
GRANT USAGE ON SCHEMA public TO algions_admin, algions_app, algions_backup;
GRANT CREATE, USAGE ON SCHEMA public TO algions_admin;

-- Privileges for algions_admin (Full DDL & Schema Management)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO algions_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO algions_admin;

-- Privileges for runtime algions_app:
-- Standard read/write on product, order, and idempotency tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE products, orders, order_items, idempotency_keys TO algions_app;
GRANT SELECT ON TABLE admin_users TO algions_app;

-- Critical Security Policy: Application role can ONLY INSERT into audit_events (strictly append-only: NO UPDATE, NO DELETE)
GRANT SELECT, INSERT ON TABLE audit_events TO algions_app;
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE audit_events FROM algions_app;

-- Allow sequence usage for IDs and auto-increment
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO algions_app;

-- Explicitly block algions_app from creating tables, types, or roles
REVOKE CREATE ON SCHEMA public FROM algions_app;

-- Privileges for algions_backup: Read-only access to all public tables and sequences for pg_dump
GRANT SELECT ON ALL TABLES IN SCHEMA public TO algions_backup;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO algions_backup;

-- Set Default Privileges for future tables created by algions_admin
ALTER DEFAULT PRIVILEGES FOR ROLE algions_admin IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO algions_app;
ALTER DEFAULT PRIVILEGES FOR ROLE algions_admin IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO algions_app;
ALTER DEFAULT PRIVILEGES FOR ROLE algions_admin IN SCHEMA public GRANT SELECT ON TABLES TO algions_backup;
ALTER DEFAULT PRIVILEGES FOR ROLE algions_admin IN SCHEMA public GRANT SELECT ON SEQUENCES TO algions_backup;
