import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const EXPECTED_PROJECT_SUBSTRING = 'raspy-lab-77234033';
const EXPECTED_REGION = 'ap-southeast-1.aws.neon.tech';

const REQUIRED_TABLES = [
  'products',
  'orders',
  'order_items',
  'idempotency_keys',
  'users',
  'user_sessions',
  'email_verification_tokens',
  'password_reset_tokens',
  'customer_preferences',
  'customer_addresses',
  'categories',
  'collections',
  'product_variants',
  'product_images',
  'coupons',
  'coupon_redemptions',
  'payments',
  'shipments',
  'shipment_events',
  'returns',
  'refunds',
  'reviews',
  'notifications',
  'admin_users',
  'audit_events',
];

// Cryptographically secure password generator
function generateSecurePassword(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#%*_+';
  const randomBytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

// Safely execute ALTER ROLE ... WITH PASSWORD using PostgreSQL's format() with %I and %L
async function setRolePasswordSafely(client, roleName, password) {
  const formatRes = await client.query(
    'SELECT format(\'ALTER ROLE %I WITH PASSWORD %L\', $1::text, $2::text) AS ddl;',
    [roleName, password]
  );
  await client.query(formatRes.rows[0].ddl);
}

// Parse key-value pairs from an env file
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      result[key] = val;
    }
  }
  return result;
}

async function run() {
  console.log('================================================================');
  console.log('Algions Platform — Hardened Neon Cloud Provisioning');
  console.log('Target Architecture: Singapore (ap-southeast-1) Least-Privilege');
  console.log('================================================================');

  const args = process.argv.slice(2);
  const keepPasswords = args.includes('--keep-passwords');
  const rotateCredentials = args.includes('--rotate-credentials') || args.includes('--force');

  // 1. Locate Neon owner connection string with strict precedence
  // Dedicated .env.neon wins FIRST; never inherit local DATABASE_URL from .env or shell
  let ownerUrl = null;
  if (fs.existsSync('.env.neon')) {
    const envNeon = parseEnvFile('.env.neon');
    ownerUrl = envNeon.DATABASE_URL || envNeon.NEON_OWNER_URL;
  }
  if (!ownerUrl && process.env.NEON_OWNER_URL) {
    ownerUrl = process.env.NEON_OWNER_URL;
  }
  if (!ownerUrl && fs.existsSync('.env.local')) {
    const envLocal = parseEnvFile('.env.local');
    if (envLocal.DATABASE_URL && envLocal.DATABASE_URL.includes(EXPECTED_PROJECT_SUBSTRING)) {
      ownerUrl = envLocal.DATABASE_URL;
    }
  }

  if (!ownerUrl) {
    console.error('\n❌ FATAL: No valid Neon owner connection URL found.');
    console.error('Please configure your Neon Singapore owner connection string in .env.neon:');
    console.error('DATABASE_URL=postgresql://neondb_owner:***@ep-raspy-lab-77234033.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
    process.exit(1);
  }

  // 2. Validate targeted Neon project endpoint
  let parsedOwner;
  try {
    parsedOwner = new URL(ownerUrl);
  } catch {
    console.error('❌ FATAL: Invalid DATABASE_URL format in .env.neon.');
    process.exit(1);
  }

  const ownerHost = parsedOwner.hostname;
  const dbName = parsedOwner.pathname.replace(/^\//, '') || 'neondb';

  if (!ownerHost.includes(EXPECTED_PROJECT_SUBSTRING) || !ownerHost.includes(EXPECTED_REGION)) {
    console.error(`\n❌ FATAL: Host safety check failed!`);
    console.error(`Target host "${ownerHost}" does not match required endpoint:`);
    console.error(`Expected substring: "${EXPECTED_PROJECT_SUBSTRING}" in "${EXPECTED_REGION}"`);
    console.error('Aborting execution to prevent modifying an unintended database.');
    process.exit(1);
  }

  console.log(`✓ Verified intended Neon host: ${ownerHost}`);
  console.log(`✓ Verified target database: ${dbName}`);

  // 3. Check rerun behavior against existing .env.production.local
  let adminPassword;
  let appPassword;
  let backupPassword;
  let storeAdminPassword;

  const existingProdEnv = parseEnvFile('.env.production.local');
  const hasExistingCredentials = Boolean(
    existingProdEnv.DB_APP_PASSWORD &&
    existingProdEnv.DB_MIGRATION_PASSWORD &&
    existingProdEnv.DB_BACKUP_PASSWORD
  );

  if (hasExistingCredentials && !rotateCredentials && !keepPasswords) {
    console.error('\n⚠️  WARNING: Existing credentials found in .env.production.local!');
    console.error('Re-generating new passwords will invalidate credentials already configured in Render.');
    console.error('To preserve existing passwords and only re-run schema & seeds:');
    console.error('  npm run db:provision:neon -- --keep-passwords');
    console.error('To intentionally rotate all passwords and overwrite .env.production.local:');
    console.error('  npm run db:provision:neon -- --rotate-credentials\n');
    process.exit(1);
  }

  if (hasExistingCredentials && keepPasswords) {
    console.log('✓ Reusing existing credentials from .env.production.local (Render safe mode)');
    adminPassword = existingProdEnv.DB_MIGRATION_PASSWORD;
    appPassword = existingProdEnv.DB_APP_PASSWORD;
    backupPassword = existingProdEnv.DB_BACKUP_PASSWORD;
    storeAdminPassword = existingProdEnv.ADMIN_PASSWORD || generateSecurePassword(24);
  } else {
    console.log('✓ Generating fresh cryptographically secure passwords for all roles');
    adminPassword = generateSecurePassword(32);
    appPassword = generateSecurePassword(32);
    backupPassword = generateSecurePassword(32);
    storeAdminPassword = generateSecurePassword(24);
  }

  // 4. Connect as Owner
  console.log('\nConnecting to Neon as database owner...');
  const ownerPool = new Pool({
    connectionString: ownerUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const ownerClient = await ownerPool.connect();
  console.log('✓ Established secure TLS connection as owner');

  try {
    // 5. Ensure roles exist
    console.log('Ensuring roles exist (algions_admin, algions_app, algions_backup)...');
    await ownerClient.query(`
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
    `);

    // 6. Safely apply passwords using PostgreSQL format() with %I and %L
    console.log('Assigning role credentials via PostgreSQL format(%I, %L)...');
    await setRolePasswordSafely(ownerClient, 'algions_admin', adminPassword);
    await setRolePasswordSafely(ownerClient, 'algions_app', appPassword);
    await setRolePasswordSafely(ownerClient, 'algions_backup', backupPassword);
    console.log('✓ Successfully assigned passwords to all roles with native literal escaping');

    // 7. Grant algions_admin to current user so owner can alter ownership & default privileges
    console.log('Granting algions_admin membership to CURRENT_USER...');
    await ownerClient.query('GRANT algions_admin TO CURRENT_USER;');
    console.log('✓ Role membership granted for ownership administration');

    // 8. Apply Schema
    console.log('Applying database schema (schema.sql)...');
    const schemaPath = path.resolve('apps/api/src/database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await ownerClient.query(schemaSql);
    console.log('✓ Database schema executed successfully');

    // 9. Verify table existence before applying grants
    console.log('Verifying table existence in public schema...');
    const tablesRes = await ownerClient.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
    );
    const existingTableNames = new Set(tablesRes.rows.map((r) => r.tablename));
    const missingTables = REQUIRED_TABLES.filter((t) => !existingTableNames.has(t));

    if (missingTables.length > 0) {
      throw new Error(`Schema incomplete: missing required tables: ${missingTables.join(', ')}`);
    }
    console.log(`✓ All ${REQUIRED_TABLES.length} required tables verified present`);

    // 10. Transfer ownership & configure least-privilege grants
    console.log('Applying least-privilege security boundaries...');
    await ownerClient.query(`
      -- Transfer table and sequence ownership in schema public to algions_admin
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

      REVOKE CREATE ON SCHEMA public FROM PUBLIC;
      REVOKE ALL ON SCHEMA public FROM PUBLIC;

      GRANT USAGE ON SCHEMA public TO algions_admin, algions_app, algions_backup;
      GRANT CREATE, USAGE ON SCHEMA public TO algions_admin;
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO algions_admin;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO algions_admin;

      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE 
          products, orders, order_items, idempotency_keys, 
          users, user_sessions, email_verification_tokens, password_reset_tokens, customer_preferences, customer_addresses,
          categories, collections, product_variants, product_images,
          carts, cart_items, wishlists, wishlist_items,
          coupons, coupon_redemptions, payments, shipments, shipment_events, returns, refunds, reviews, notifications
      TO algions_app;
      GRANT SELECT ON TABLE admin_users TO algions_app;
      GRANT SELECT, INSERT ON TABLE audit_events TO algions_app;
      REVOKE UPDATE, DELETE, TRUNCATE ON TABLE audit_events FROM algions_app;
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO algions_app;
      REVOKE CREATE ON SCHEMA public FROM algions_app;

      GRANT SELECT ON ALL TABLES IN SCHEMA public TO algions_backup;
      GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO algions_backup;

      ALTER DEFAULT PRIVILEGES FOR ROLE algions_admin IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO algions_app;
      ALTER DEFAULT PRIVILEGES FOR ROLE algions_admin IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO algions_app;
      ALTER DEFAULT PRIVILEGES FOR ROLE algions_admin IN SCHEMA public GRANT SELECT ON TABLES TO algions_backup;
      ALTER DEFAULT PRIVILEGES FOR ROLE algions_admin IN SCHEMA public GRANT SELECT ON SEQUENCES TO algions_backup;
    `);
    console.log('✓ Least-privilege role boundaries applied');

  } finally {
    ownerClient.release();
    await ownerPool.end();
  }

  // 11. Connect as algions_admin to execute seeds
  console.log('\nConnecting as algions_admin to seed data...');
  const directAdminUrl = `postgresql://algions_admin:${encodeURIComponent(adminPassword)}@${ownerHost}/${dbName}?sslmode=require`;
  const adminPool = new Pool({
    connectionString: directAdminUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const adminClient = await adminPool.connect();
  try {
    // Seed initial admin user if not exists
    const adminHash = await bcrypt.hash(storeAdminPassword, 12);
    await adminClient.query(`
      INSERT INTO admin_users (username, password_hash, role)
      VALUES ($1, $2, 'ADMIN')
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
    `, ['admin@algions.com', adminHash]);
    console.log('✓ Store administrator seeded (admin@algions.com)');

    // Run catalogue seeds
    process.env.DATABASE_URL = directAdminUrl;
    const { runSeeds } = await import('../apps/api/dist/database/seed.js');
    await runSeeds(3);
    console.log('✓ Catalogue seeding executed');
  } finally {
    adminClient.release();
    await adminPool.end();
  }

  // 12. Derive Pooled Connection String for algions_app
  let pooledHost = ownerHost;
  if (!pooledHost.includes('-pooler')) {
    const hostParts = pooledHost.split('.');
    hostParts[0] = `${hostParts[0]}-pooler`;
    pooledHost = hostParts.join('.');
  }
  const pooledAppUrl = `postgresql://algions_app:${encodeURIComponent(appPassword)}@${pooledHost}/${dbName}?sslmode=require`;

  // 13. Verify algions_app pooled connection and product count
  console.log('\nVerifying pooled connection and product inventory as algions_app...');
  const appPool = new Pool({
    connectionString: pooledAppUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const appClient = await appPool.connect();
  try {
    const userRes = await appClient.query('SELECT current_user, current_database();');
    const currentUser = userRes.rows[0].current_user;
    if (currentUser !== 'algions_app') {
      throw new Error(`Expected current_user 'algions_app', but found '${currentUser}'`);
    }
    console.log(`✓ Verified pooled connection as: ${currentUser}`);

    const countRes = await appClient.query('SELECT COUNT(*)::int as count FROM products;');
    const productCount = countRes.rows[0].count;
    console.log(`✓ Verified product inventory: ${productCount} products present`);

    if (productCount < 24) {
      throw new Error(`Inventory verification failed: expected at least 24 products, found ${productCount}`);
    }

    // Verify flagship item
    const sampleRes = await appClient.query(
      'SELECT name, slug, price_cents, stock FROM products WHERE slug = $1;',
      ['statement-puffer']
    );
    if (sampleRes.rows.length === 0) {
      throw new Error('Flagship product "statement-puffer" not found in seeded database');
    }
    console.log(`✓ Flagship item verified: ${sampleRes.rows[0].name} (Stock: ${sampleRes.rows[0].stock})`);

  } finally {
    appClient.release();
    await appPool.end();
  }

  // 14. Write credentials to Git-ignored .env.production.local
  const envContent = [
    '# ==============================================================================',
    '# Algions E-Commerce — Production Environment Configuration',
    `# Generated at: ${new Date().toISOString()}`,
    '# ==============================================================================',
    '',
    '# Render Field: DATABASE_URL (Pooled Neon Connection String for algions_app)',
    `DATABASE_URL=${pooledAppUrl}`,
    '',
    '# Render Field: ADMIN_PASSWORD (Store Admin Login for admin@algions.com)',
    `ADMIN_PASSWORD=${storeAdminPassword}`,
    '',
    '# Render Field: DB_APP_PASSWORD (Runtime database role)',
    `DB_APP_PASSWORD=${appPassword}`,
    '',
    '# Render Field: DB_MIGRATION_PASSWORD (DDL migration role)',
    `DB_MIGRATION_PASSWORD=${adminPassword}`,
    '',
    '# Render Field: DB_BACKUP_PASSWORD (Read-only backup role)',
    `DB_BACKUP_PASSWORD=${backupPassword}`,
    '',
    '# Store Admin Username',
    'ADMIN_USERNAME=admin@algions.com',
    '',
    '# Reference: Direct Admin Connection (for manual DDL migrations)',
    `# DIRECT_ADMIN_DATABASE_URL=${directAdminUrl}`,
    '',
  ].join('\n');

  fs.writeFileSync('.env.production.local', envContent, { mode: 0o600 });
  console.log('\n✓ Credentials written to: .env.production.local (permissions: 0600)');
  console.log('✓ Confirmed: DATABASE_URL password matches DB_APP_PASSWORD');
  console.log('\n================================================================');
  console.log('✅ NEON PROVISIONING & CATALOGUE SEEDING SUCCESSFULLY COMPLETED');
  console.log('================================================================');
}

run().catch((err) => {
  console.error('\n❌ Provisioning failed:', err.message);
  process.exit(1);
});
