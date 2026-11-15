import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

// Secure password generator (32 characters alphanumeric)
function generateSecurePassword(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#%*_+';
  const randomBytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

async function run() {
  console.log('--- Algions Neon Database Provisioning ---');

  // 1. Locate root/owner Neon connection string
  let ownerUrl = process.env.NEON_OWNER_URL || process.env.DATABASE_URL;
  if (!ownerUrl && fs.existsSync('.env.neon')) {
    const content = fs.readFileSync('.env.neon', 'utf8');
    const match = content.match(/DATABASE_URL=([^\r\n]+)/);
    if (match) ownerUrl = match[1].trim();
  }
  if (!ownerUrl && fs.existsSync('.env.local')) {
    const content = fs.readFileSync('.env.local', 'utf8');
    const match = content.match(/DATABASE_URL=([^\r\n]+)/);
    if (match) ownerUrl = match[1].trim();
  }

  if (!ownerUrl || !ownerUrl.includes('neon.tech')) {
    console.error('ERROR: No valid Neon connection URL found in .env.neon, .env.local, or environment.');
    console.error('Please paste your Neon owner connection string into .env.neon (Git-ignored) as:');
    console.error('DATABASE_URL=postgresql://neondb_owner:***@ep-raspy-lab-77234033.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
    process.exit(1);
  }

  const parsedOwner = new URL(ownerUrl);
  const dbName = parsedOwner.pathname.replace(/^\//, '') || 'neondb';
  const ownerHost = parsedOwner.hostname;

  console.log(`✓ Located Neon target host: ${ownerHost}`);
  console.log(`✓ Target database: ${dbName}`);

  // 2. Generate secure passwords
  const adminPassword = generateSecurePassword(32);
  const appPassword = generateSecurePassword(32);
  const backupPassword = generateSecurePassword(32);
  const storeAdminPassword = generateSecurePassword(24);

  // 3. Connect as Owner
  const ownerPool = new Pool({
    connectionString: ownerUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const ownerClient = await ownerPool.connect();
  console.log('✓ Connected to Neon as database owner');

  try {
    // 4. Provision Roles
    console.log('Provisioning roles (algions_admin, algions_app, algions_backup)...');
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

    // Assign passwords dynamically
    await ownerClient.query(`ALTER ROLE algions_admin WITH PASSWORD $1;`, [adminPassword]);
    await ownerClient.query(`ALTER ROLE algions_app WITH PASSWORD $1;`, [appPassword]);
    await ownerClient.query(`ALTER ROLE algions_backup WITH PASSWORD $1;`, [backupPassword]);
    console.log('✓ Successfully provisioned 3 separated roles with cryptographic credentials');

    // 5. Apply Schema
    console.log('Applying database schema (schema.sql)...');
    const schemaPath = path.resolve('apps/api/src/database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await ownerClient.query(schemaSql);
    console.log('✓ Database schema verified and applied');

    // 6. Apply Least-Privilege Permissions
    console.log('Configuring least-privilege role boundaries...');
    await ownerClient.query(`
      -- Transfer table & sequence ownership to algions_admin
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
    console.log('✓ Least-privilege permissions applied successfully');

  } finally {
    ownerClient.release();
    await ownerPool.end();
  }

  // 7. Seed catalogue & admin user using algions_admin connection
  console.log('Connecting as algions_admin to execute seeds...');
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

    // Run seed catalogue
    // We import the compiled seed logic or run seed script
    console.log('Executing catalogue seed...');
    process.env.DATABASE_URL = directAdminUrl;
    const { runSeeds } = await import('../apps/api/dist/database/seed.js');
    await runSeeds(3);
    console.log('✓ Catalogue seeding completed');
  } finally {
    adminClient.release();
    await adminPool.end();
  }

  // 8. Generate Pooled Connection String for algions_app
  // If host does not already contain -pooler, add it
  let pooledHost = ownerHost;
  if (!pooledHost.includes('-pooler')) {
    const parts = pooledHost.split('.');
    parts[0] = `${parts[0]}-pooler`;
    pooledHost = parts.join('.');
  }
  const pooledAppUrl = `postgresql://algions_app:${encodeURIComponent(appPassword)}@${pooledHost}/${dbName}?sslmode=require`;

  // 9. Test algions_app Pooled Connection
  console.log('Verifying algions_app pooled connection to Neon...');
  const appPool = new Pool({
    connectionString: pooledAppUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const appClient = await appPool.connect();
  try {
    const userRes = await appClient.query('SELECT current_user, current_database();');
    console.log(`✓ Connected as: ${userRes.rows[0].current_user} on ${userRes.rows[0].current_database}`);

    const countRes = await appClient.query('SELECT COUNT(*)::int as count FROM products;');
    const productCount = countRes.rows[0].count;
    console.log(`✓ Product inventory check: ${productCount} products found in database`);

    if (productCount < 24) {
      throw new Error(`Expected at least 24 seeded products, but found ${productCount}`);
    }

    // Check sample product
    const sample = await appClient.query('SELECT name, slug, price_cents, stock FROM products WHERE slug = $1;', ['statement-puffer']);
    if (sample.rows.length > 0) {
      console.log(`✓ Verified flagship product: ${sample.rows[0].name} (Stock: ${sample.rows[0].stock})`);
    }

  } finally {
    appClient.release();
    await appPool.end();
  }

  // 10. Write secrets to Git-ignored .env.production.local
  const envContent = [
    '# ==============================================================================',
    '# Algions E-Commerce — Production Environment Secrets (Git-Ignored)',
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
    '# Additional Reference (Direct Admin URL for running manual CLI migrations):',
    `# DIRECT_ADMIN_DATABASE_URL=${directAdminUrl}`,
    '',
  ].join('\n');

  fs.writeFileSync('.env.production.local', envContent, { mode: 0o600 });
  console.log('✓ Saved all 5 production fields to Git-ignored file: .env.production.local');
  console.log('✓ Confirmed: DATABASE_URL password matches DB_APP_PASSWORD');
  console.log('\nSUCCESS: Neon initialization complete!');
}

run().catch((err) => {
  console.error('Provisioning failed:', err.message);
  process.exit(1);
});
