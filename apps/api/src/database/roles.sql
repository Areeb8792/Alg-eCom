-- ==============================================================================
-- Algions Platform — Database Least-Privilege Role Architecture
-- Separates bootstrap admin, DDL migrations, runtime DML, and read-only backups.
-- ==============================================================================

-- 1. Fail-closed credential validation: All three role passwords MUST be supplied via psql variables
\if !:{?admin_password}
  \echo 'FATAL: Required psql variable "admin_password" is missing. Aborting role provisioning.'
  DO $$ BEGIN RAISE EXCEPTION 'FATAL: Required psql variable "admin_password" is missing. Aborting role provisioning.'; END $$;
\endif

\if !:{?app_password}
  \echo 'FATAL: Required psql variable "app_password" is missing. Aborting role provisioning.'
  DO $$ BEGIN RAISE EXCEPTION 'FATAL: Required psql variable "app_password" is missing. Aborting role provisioning.'; END $$;
\endif

\if !:{?backup_password}
  \echo 'FATAL: Required psql variable "backup_password" is missing. Aborting role provisioning.'
  DO $$ BEGIN RAISE EXCEPTION 'FATAL: Required psql variable "backup_password" is missing. Aborting role provisioning.'; END $$;
\endif

-- 2. Create separated roles if they do not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'algions_admin') THEN
        CREATE ROLE algions_admin WITH LOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'algions_app') THEN
        CREATE ROLE algions_app WITH LOGIN NOCREATEDB NOCREATEROLE NOINHERIT;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'algions_backup') THEN
        CREATE ROLE algions_backup WITH LOGIN NOCREATEDB NOCREATEROLE NOINHERIT;
    END IF;
END $$;

-- 3. Set validated credentials dynamically from psql variables (no hardcoded fallback)
ALTER ROLE algions_admin WITH PASSWORD :'admin_password';
ALTER ROLE algions_app WITH PASSWORD :'app_password';
ALTER ROLE algions_backup WITH PASSWORD :'backup_password';

-- 4. Transfer table and sequence ownership in schema public to algions_admin
-- In PostgreSQL, only the table OWNER (or superuser) can perform DDL operations (ALTER TABLE, ADD/DROP COLUMN).
-- Transferring ownership enables algions_admin to execute automated schema migrations on existing objects.
DO $$
DECLARE
    tbl text;
    seq text;
BEGIN
    FOR tbl IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I OWNER TO algions_admin', tbl);
    END LOOP;
    FOR seq IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE format('ALTER SEQUENCE public.%I OWNER TO algions_admin', seq);
    END LOOP;
END $$;

-- 5. Revoke default public schema creation to enforce least-privilege boundary
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- 6. Grant Schema Usages
GRANT USAGE ON SCHEMA public TO algions_admin, algions_app, algions_backup;
GRANT CREATE, USAGE ON SCHEMA public TO algions_admin;

-- 7. Privileges for algions_admin (Full DDL & Schema Management)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO algions_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO algions_admin;

-- 8. Privileges for runtime algions_app:
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

-- 9. Privileges for algions_backup: Read-only access to all public tables and sequences for pg_dump
GRANT SELECT ON ALL TABLES IN SCHEMA public TO algions_backup;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO algions_backup;

-- 10. Set Default Privileges for future tables created by algions_admin
ALTER DEFAULT PRIVILEGES FOR ROLE algions_admin IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO algions_app;
ALTER DEFAULT PRIVILEGES FOR ROLE algions_admin IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO algions_app;
ALTER DEFAULT PRIVILEGES FOR ROLE algions_admin IN SCHEMA public GRANT SELECT ON TABLES TO algions_backup;
ALTER DEFAULT PRIVILEGES FOR ROLE algions_admin IN SCHEMA public GRANT SELECT ON SEQUENCES TO algions_backup;
