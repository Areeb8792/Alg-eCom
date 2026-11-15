import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { pool } from './connection.js';
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

    // 1. Seed Categories
    const categories = [
      { name: 'MENSWEAR', slug: 'menswear', parentSlug: null, desc: 'Structural masculine tailoring & outerwear', sort: 1 },
      { name: 'Outerwear', slug: 'menswear-outerwear', parentSlug: 'menswear', desc: 'Technical puffers & modular field coats', sort: 1 },
      { name: 'Tailoring', slug: 'menswear-tailoring', parentSlug: 'menswear', desc: 'Boxy blazers & pleated trousers', sort: 2 },
      { name: 'Tops & Jerseys', slug: 'menswear-tops', parentSlug: 'menswear', desc: 'Heavyweight selvedge jerseys & dropped shoulder tees', sort: 3 },
      { name: 'WOMENSWEAR', slug: 'womenswear', parentSlug: null, desc: 'Brutalist silhouettes & sculpted knitwear', sort: 2 },
      { name: 'Knitwear', slug: 'womenswear-knitwear', parentSlug: 'womenswear', desc: 'Ribbed merino wool & sculpted cashmere', sort: 1 },
      { name: 'Dresses & Drape', slug: 'womenswear-dresses', parentSlug: 'womenswear', desc: 'Column silhouettes & bonded silk', sort: 2 },
      { name: 'ACCESSORIES', slug: 'accessories', parentSlug: null, desc: 'Cashmere scarves & industrial hardware', sort: 3 },
      { name: 'OBJECTS & ARCHIVE', slug: 'objects-archive', parentSlug: null, desc: 'Monographs & industrial hardware', sort: 4 }
    ];

    for (const c of categories) {
      await client.query(
        `INSERT INTO categories (name, slug, description, sort_order, is_active)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            sort_order = EXCLUDED.sort_order;`,
        [c.name, c.slug, c.desc, c.sort]
      );
    }

    // Link subcategories to parent categories
    for (const c of categories) {
      if (c.parentSlug) {
        await client.query(
          `UPDATE categories
           SET parent_id = (SELECT id FROM categories WHERE slug = $1)
           WHERE slug = $2;`,
          [c.parentSlug, c.slug]
        );
      }
    }
    logger.info(`Seeded ${categories.length} categories`);

    // 2. Seed Collections
    const collections = [
      {
        name: 'Season 04 // Brutalist Heavy',
        slug: 'season-04-brutalist',
        tagline: 'Monolithic tailoring and 650GSM architectural garments',
        desc: 'The definitive Season 04 collection explores monolithic tailoring, 650GSM selvedge cottons and weatherproof technical silk down fill.',
        banner: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1600&auto=format&fit=crop',
        featured: true,
        sort: 1
      },
      {
        name: 'Monochrome Archive',
        slug: 'monochrome-archive',
        tagline: 'The definitive black, concrete and bone uniform',
        desc: 'Curated archive of timeless silhouettes rendered strictly in high-contrast Ink Black, Concrete Bone and Ash Grey.',
        banner: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop',
        featured: true,
        sort: 2
      },
      {
        name: 'Core Minimalist',
        slug: 'core-minimalist',
        tagline: 'Architectural essentials engineered for daily rotation',
        desc: 'Foundational wardrobe garments engineered with hand-finished bindings, dropped shoulders and heavyweight Japanese selvedge weaves.',
        banner: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1600&auto=format&fit=crop',
        featured: false,
        sort: 3
      }
    ];

    for (const col of collections) {
      await client.query(
        `INSERT INTO collections (name, slug, tagline, description, editorial_banner_url, is_featured, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            tagline = EXCLUDED.tagline,
            description = EXCLUDED.description,
            editorial_banner_url = EXCLUDED.editorial_banner_url,
            is_featured = EXCLUDED.is_featured,
            sort_order = EXCLUDED.sort_order;`,
        [col.name, col.slug, col.tagline, col.desc, col.banner, col.featured, col.sort]
      );
    }
    logger.info(`Seeded ${collections.length} collections`);

    // 3. Seed Products (Exactly 6 products matching CI baseline count)
    const products = [
      {
        sku: 'HW-PF-001',
        slug: 'statement-puffer',
        name: 'Statement Puffer',
        description: 'Silk blend outer shell with technical down fill. Features brutalist minimalist lines and an oversized architectural collar.',
        category: 'OUTERWEAR',
        categorySlug: 'menswear-outerwear',
        collectionSlug: 'season-04-brutalist',
        fit_type: 'OVERSIZED',
        fabric_weight: '750 GSM Down Fill',
        composition: '70% Technical Silk, 30% Polyamide, 90/10 Goose Down',
        country_of_origin: 'Italy',
        care_instructions: 'Specialist dry clean only. Store on shaped wooden hanger.',
        rating_avg: 4.9,
        rating_count: 28,
        price_cents: 14000, // $140.00
        currency: 'USD',
        stock: 15,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-PF-001-BLK-S', size: 'S', color: 'Ink Black', hex: '#1B0E0D', stock: 3 },
          { sku: 'HW-PF-001-BLK-M', size: 'M', color: 'Ink Black', hex: '#1B0E0D', stock: 6 },
          { sku: 'HW-PF-001-BLK-L', size: 'L', color: 'Ink Black', hex: '#1B0E0D', stock: 4 },
          { sku: 'HW-PF-001-BNE-M', size: 'M', color: 'Concrete Bone', hex: '#E3E2DE', stock: 2 }
        ]
      },
      {
        sku: 'HW-TE-002',
        slug: 'minimalist-tee',
        name: 'Minimalist Tee',
        description: 'Heavyweight organic cotton jersey with hand-finished collar binding and dropped shoulder construction.',
        category: 'TOPS',
        categorySlug: 'menswear-tops',
        collectionSlug: 'core-minimalist',
        fit_type: 'BOXY',
        fabric_weight: '320 GSM Selvedge Jersey',
        composition: '100% GOTS Certified Organic Cotton',
        country_of_origin: 'Portugal',
        care_instructions: 'Machine wash 30°C cold. Line dry in shade. Warm iron.',
        rating_avg: 4.8,
        rating_count: 42,
        price_cents: 6500, // $65.00
        currency: 'USD',
        stock: 30,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-TE-002-BLK-S', size: 'S', color: 'Ink Black', hex: '#1B0E0D', stock: 8 },
          { sku: 'HW-TE-002-BLK-M', size: 'M', color: 'Ink Black', hex: '#1B0E0D', stock: 12 },
          { sku: 'HW-TE-002-BLK-L', size: 'L', color: 'Ink Black', hex: '#1B0E0D', stock: 6 },
          { sku: 'HW-TE-002-GRY-M', size: 'M', color: 'Ash Grey', hex: '#7D7D7D', stock: 4 }
        ]
      },
      {
        sku: 'HW-BL-003',
        slug: 'oversized-blazer',
        name: 'Oversized Blazer',
        description: 'Structured wool-blend silhouette with sharp shoulders, concealed double-breasted horn buttons and cupro lining.',
        category: 'TAILORING',
        categorySlug: 'menswear-tailoring',
        collectionSlug: 'season-04-brutalist',
        fit_type: 'OVERSIZED',
        fabric_weight: '480 GSM Virgin Wool Blend',
        composition: '85% Virgin Wool, 15% Cashmere, 100% Bemberg Cupro Lining',
        country_of_origin: 'Japan',
        care_instructions: 'Strictly dry clean only. Steam refresh recommended.',
        rating_avg: 5.0,
        rating_count: 19,
        price_cents: 21000, // $210.00
        currency: 'USD',
        stock: 10,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-BL-003-BLK-46', size: 'S', color: 'Ink Black', hex: '#1B0E0D', stock: 2 },
          { sku: 'HW-BL-003-BLK-48', size: 'M', color: 'Ink Black', hex: '#1B0E0D', stock: 5 },
          { sku: 'HW-BL-003-BLK-50', size: 'L', color: 'Ink Black', hex: '#1B0E0D', stock: 3 }
        ]
      },
      {
        sku: 'HW-TR-004',
        slug: 'tailored-silhouette',
        name: 'Tailored Silhouette Trousers',
        description: 'High-waisted relaxed trouser cut from breathable organic linen weave with sharp front pleats.',
        category: 'TAILORING',
        categorySlug: 'menswear-tailoring',
        collectionSlug: 'monochrome-archive',
        fit_type: 'TAILORED',
        fabric_weight: '380 GSM Heavy Linen Twill',
        composition: '100% Organic Belgian Linen',
        country_of_origin: 'Portugal',
        care_instructions: 'Gentle hand wash cold or dry clean. Do not wring.',
        rating_avg: 4.7,
        rating_count: 15,
        price_cents: 18000, // $180.00
        currency: 'USD',
        stock: 18,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-TR-004-BNE-30', size: 'S', color: 'Concrete Bone', hex: '#E3E2DE', stock: 5 },
          { sku: 'HW-TR-004-BNE-32', size: 'M', color: 'Concrete Bone', hex: '#E3E2DE', stock: 8 },
          { sku: 'HW-TR-004-BNE-34', size: 'L', color: 'Concrete Bone', hex: '#E3E2DE', stock: 5 }
        ]
      },
      {
        sku: 'HW-AC-005',
        slug: 'silk-blend-scarf',
        name: 'Silk Blend Monogram Scarf',
        description: 'Raw-edged lightweight cashmere silk jacquard with subtle typographic motif.',
        category: 'ACCESSORIES',
        categorySlug: 'accessories',
        collectionSlug: 'monochrome-archive',
        fit_type: 'RELAXED',
        fabric_weight: '180 GSM Cashmere Silk Jacquard',
        composition: '65% Cashmere, 35% Mulberry Silk',
        country_of_origin: 'Scotland',
        care_instructions: 'Dry clean only. Avoid friction with abrasive jewelry.',
        rating_avg: 4.9,
        rating_count: 31,
        price_cents: 8500, // $85.00
        currency: 'USD',
        stock: 22,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-AC-005-BLK-OS', size: 'ONE SIZE', color: 'Ink Black', hex: '#1B0E0D', stock: 12 },
          { sku: 'HW-AC-005-RED-OS', size: 'ONE SIZE', color: 'Burnt Red', hex: '#C72A09', stock: 10 }
        ]
      },
      {
        sku: 'HW-FC-006',
        slug: 'technical-field-coat',
        name: 'Technical Field Coat',
        description: 'Water-repellent matte nylon shell with modular magnetic utility pockets and storm flap.',
        category: 'OUTERWEAR',
        categorySlug: 'menswear-outerwear',
        collectionSlug: 'season-04-brutalist',
        fit_type: 'OVERSIZED',
        fabric_weight: '520 GSM Bonded Matte Nylon 3-Layer',
        composition: '100% Recycled Technical Polyamide, PTFE Membrane',
        country_of_origin: 'Japan',
        care_instructions: 'Wipe clean with damp cloth or specialist membrane laundry.',
        rating_avg: 4.8,
        rating_count: 11,
        price_cents: 32000, // $320.00
        currency: 'USD',
        stock: 6,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-FC-006-OLV-M', size: 'M', color: 'Olive Drab', hex: '#4A5340', stock: 4 },
          { sku: 'HW-FC-006-OLV-L', size: 'L', color: 'Olive Drab', hex: '#4A5340', stock: 2 }
        ]
      }
    ];

    for (const p of products) {
      const prodRes = await client.query(
        `INSERT INTO products (
            sku, slug, name, description, category,
            collection_id, category_id, fit_type, fabric_weight, composition, country_of_origin, care_instructions,
            rating_avg, rating_count, price_cents, currency, stock, is_active, image_url
         )
         VALUES (
            $1, $2, $3, $4, $5,
            (SELECT id FROM collections WHERE slug = $6),
            (SELECT id FROM categories WHERE slug = $7),
            $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
         )
         ON CONFLICT (sku) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            collection_id = EXCLUDED.collection_id,
            category_id = EXCLUDED.category_id,
            fit_type = EXCLUDED.fit_type,
            fabric_weight = EXCLUDED.fabric_weight,
            composition = EXCLUDED.composition,
            country_of_origin = EXCLUDED.country_of_origin,
            care_instructions = EXCLUDED.care_instructions,
            rating_avg = EXCLUDED.rating_avg,
            rating_count = EXCLUDED.rating_count,
            price_cents = EXCLUDED.price_cents,
            stock = EXCLUDED.stock,
            image_url = EXCLUDED.image_url,
            updated_at = NOW()
         RETURNING id;`,
        [
          p.sku, p.slug, p.name, p.description, p.category,
          p.collectionSlug, p.categorySlug,
          p.fit_type, p.fabric_weight, p.composition, p.country_of_origin, p.care_instructions,
          p.rating_avg, p.rating_count, p.price_cents, p.currency, p.stock, p.is_active, p.image_url
        ]
      );

      const productId = prodRes.rows[0].id;

      // Seed Variants for Product
      for (const v of p.variants) {
        await client.query(
          `INSERT INTO product_variants (product_id, sku, size, color, color_hex, stock, price_cents, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
           ON CONFLICT (sku) DO UPDATE SET
              size = EXCLUDED.size,
              color = EXCLUDED.color,
              color_hex = EXCLUDED.color_hex,
              stock = EXCLUDED.stock,
              price_cents = EXCLUDED.price_cents,
              is_active = EXCLUDED.is_active,
              updated_at = NOW();`,
          [productId, v.sku, v.size, v.color, v.hex, v.stock, p.price_cents]
        );
      }

      // Seed Primary Image for Product
      await client.query(
        `INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
         VALUES ($1, $2, $3, TRUE, 1)
         ON CONFLICT DO NOTHING;`,
        [productId, p.image_url, p.name]
      );
    }
    logger.info(`Seeded ${products.length} products with variants and gallery images`);

    // 4. Seed Admin User
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

    // 5. Record Audit Event for Seed
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
      console.error('Seed failed:', err);
      logger.error({ err }, 'Seed script error');
      await pool.end();
      process.exit(1);
    });
}
