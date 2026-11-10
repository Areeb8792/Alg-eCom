import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { pool, query } from './connection.js';
import { config } from '../config/index.js';
import { logger } from '../logging/logger.js';

export async function runSeeds(retries = 5): Promise<void> {
  logger.info('Starting database seeding...');
  let client;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      client = await pool.connect();
      break;
    } catch (err) {
      if (attempt === retries) throw err;
      logger.warn({ attempt, err }, 'Failed to connect to database for seeding, retrying in 2s...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (!client) {
    throw new Error('Database connection failed after multiple retries');
  }

  try {
    await client.query('BEGIN');

    // 1. Seed Products
    const products = [
      {
        sku: 'HW-PF-001',
        slug: 'statement-puffer',
        name: 'Statement Puffer',
        description: 'Silk blend outer shell with technical down fill. Features brutalist minimalist lines and an oversized architectural collar.',
        category: 'OUTERWEAR',
        price_cents: 14000, // $140.00
        currency: 'USD',
        stock: 15,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop'
      },
      {
        sku: 'HW-TE-002',
        slug: 'minimalist-tee',
        name: 'Minimalist Tee',
        description: 'Heavyweight organic cotton jersey with hand-finished collar binding and dropped shoulder construction.',
        category: 'TOPS',
        price_cents: 6500, // $65.00
        currency: 'USD',
        stock: 30,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop'
      },
      {
        sku: 'HW-BL-003',
        slug: 'oversized-blazer',
        name: 'Oversized Blazer',
        description: 'Structured wool-blend silhouette with sharp shoulders, concealed double-breasted horn buttons and cupro lining.',
        category: 'TAILORING',
        price_cents: 21000, // $210.00
        currency: 'USD',
        stock: 10,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop'
      },
      {
        sku: 'HW-TR-004',
        slug: 'tailored-silhouette',
        name: 'Tailored Silhouette Trousers',
        description: 'High-waisted relaxed trouser cut from breathable organic linen weave with sharp front pleats.',
        category: 'TAILORING',
        price_cents: 18000, // $180.00
        currency: 'USD',
        stock: 18,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop'
      },
      {
        sku: 'HW-AC-005',
        slug: 'silk-blend-scarf',
        name: 'Silk Blend Monogram Scarf',
        description: 'Raw-edged lightweight cashmere silk jacquard with subtle typographic motif.',
        category: 'ACCESSORIES',
        price_cents: 8500, // $85.00
        currency: 'USD',
        stock: 22,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=1000&auto=format&fit=crop'
      },
      {
        sku: 'HW-FC-006',
        slug: 'technical-field-coat',
        name: 'Technical Field Coat',
        description: 'Water-repellent matte nylon shell with modular magnetic utility pockets and storm flap.',
        category: 'OUTERWEAR',
        price_cents: 32000, // $320.00
        currency: 'USD',
        stock: 6,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop'
      }
    ];

    for (const p of products) {
      await client.query(
        `INSERT INTO products (sku, slug, name, description, category, price_cents, currency, stock, is_active, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (sku) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            price_cents = EXCLUDED.price_cents,
            stock = EXCLUDED.stock,
            image_url = EXCLUDED.image_url,
            updated_at = NOW();`,
        [p.sku, p.slug, p.name, p.description, p.category, p.price_cents, p.currency, p.stock, p.is_active, p.image_url]
      );
    }
    logger.info(`Seeded ${products.length} products`);

    // 2. Seed Admin User
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(config.ADMIN_PASSWORD, salt);

    const adminRes = await client.query(
      `INSERT INTO admin_users (username, password_hash, role)
       VALUES ($1, $2, 'ADMIN')
       ON CONFLICT (username) DO UPDATE SET
          password_hash = EXCLUDED.password_hash
       RETURNING id, username;`,
      [config.ADMIN_USERNAME, passwordHash]
    );

    const admin = adminRes.rows[0];
    logger.info({ username: admin.username }, 'Admin user provisioned');

    // 3. Record Audit Event for Seed
    await client.query(
      `INSERT INTO audit_events (actor_id, actor_username, action, resource_type, resource_id, before_state, after_state, correlation_id)
       VALUES ($1, $2, 'SYSTEM_BOOTSTRAP_SEED', 'SYSTEM', 'INITIAL_SEED', NULL, $3, 'system-seed-bootstrap');`,
      [admin.id, admin.username, JSON.stringify({ seededProductsCount: products.length, timestamp: new Date().toISOString() })]
    );

    await client.query('COMMIT');
    logger.info('Database seeding completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ err: error }, 'Database seeding failed');
    throw error;
  } finally {
    client.release();
  }
}

const isMainScript = process.argv[1] && (
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) ||
  process.argv[1].endsWith('seed.ts') ||
  process.argv[1].endsWith('seed.js')
);

if (isMainScript) {
  runSeeds()
    .then(async () => {
      logger.info('Seed complete');
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ err }, 'Seed script error');
      await pool.end();
      process.exit(1);
    });
}
