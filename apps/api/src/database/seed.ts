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
        ],
        galleryImages: [
          { url: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop', alt: 'Technical Field Coat Back Detail' }
        ]
      },
      // 7. Modular Field Jacket
      {
        sku: 'HW-MJ-007',
        slug: 'modular-field-jacket',
        name: 'Modular Field Jacket',
        description: 'Triple-layer bonded storm shell with detachable magnetic cargo compartments, articulated sleeves, and tactical storm collar.',
        category: 'OUTERWEAR',
        categorySlug: 'menswear-outerwear',
        collectionSlug: 'season-04-brutalist',
        fit_type: 'OVERSIZED',
        fabric_weight: '480 GSM Waterproof Matte Ripstop',
        composition: '85% Technical Polyamide, 15% Elastane with PTFE Membrane',
        country_of_origin: 'Japan',
        care_instructions: 'Machine wash cold delicate cycle. Hang to dry in shade.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 34000, // $340.00
        currency: 'USD',
        stock: 14,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-MJ-007-BLK-S', size: 'S', color: 'Ink Black', hex: '#1B0E0D', stock: 4 },
          { sku: 'HW-MJ-007-BLK-M', size: 'M', color: 'Ink Black', hex: '#1B0E0D', stock: 6 },
          { sku: 'HW-MJ-007-BLK-L', size: 'L', color: 'Ink Black', hex: '#1B0E0D', stock: 4 }
        ],
        galleryImages: [
          { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop', alt: 'Modular Field Jacket Silhouette' }
        ]
      },
      // 8. Technical Shell Parka
      {
        sku: 'HW-SP-008',
        slug: 'technical-shell-parka',
        name: 'Technical Shell Parka',
        description: 'Floor-sweeping weatherproof parka engineered with articulated shoulder geometry, waterproof taped seams, and fishtail drawcord.',
        category: 'OUTERWEAR',
        categorySlug: 'menswear-outerwear',
        collectionSlug: 'season-04-brutalist',
        fit_type: 'OVERSIZED',
        fabric_weight: '420 GSM 3-Layer Technical Twill',
        composition: '100% Recycled Nylon Shell, Sealed Breathable Membrane',
        country_of_origin: 'Italy',
        care_instructions: 'Specialist membrane clean only.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 38000, // $380.00
        currency: 'USD',
        stock: 12,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-SP-008-BLK-S', size: 'S', color: 'Ink Black', hex: '#1B0E0D', stock: 3 },
          { sku: 'HW-SP-008-BLK-M', size: 'M', color: 'Ink Black', hex: '#1B0E0D', stock: 5 },
          { sku: 'HW-SP-008-GRY-L', size: 'L', color: 'Ash Grey', hex: '#7D7D7D', stock: 4 }
        ]
      },
      // 9. Utility Overshirt
      {
        sku: 'HW-UO-009',
        slug: 'utility-overshirt',
        name: 'Utility Overshirt',
        description: 'Structured heavy cotton twill shirt jacket featuring concealed horn buttons, reinforced elbow patches, and dual drop-entry chest pockets.',
        category: 'TOPS',
        categorySlug: 'menswear-tops',
        collectionSlug: 'core-minimalist',
        fit_type: 'BOXY',
        fabric_weight: '360 GSM Heavy Milled Twill',
        composition: '100% Combed Compact Cotton',
        country_of_origin: 'Portugal',
        care_instructions: 'Machine wash cold 30°C. Warm iron on reverse.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 16500, // $165.00
        currency: 'USD',
        stock: 20,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-UO-009-BLK-S', size: 'S', color: 'Ink Black', hex: '#1B0E0D', stock: 5 },
          { sku: 'HW-UO-009-BLK-M', size: 'M', color: 'Ink Black', hex: '#1B0E0D', stock: 8 },
          { sku: 'HW-UO-009-OLV-L', size: 'L', color: 'Olive Drab', hex: '#4A5340', stock: 7 }
        ]
      },
      // 10. Heavyweight Long Sleeve Tee
      {
        sku: 'HW-LS-010',
        slug: 'heavyweight-long-sleeve-tee',
        name: 'Heavyweight Long Sleeve Tee',
        description: 'Dense double-jersey knit with ribbed mock cuffs, pronounced dropped shoulders, and seamless tubular torso construction.',
        category: 'TOPS',
        categorySlug: 'menswear-tops',
        collectionSlug: 'core-minimalist',
        fit_type: 'BOXY',
        fabric_weight: '380 GSM Heavyweight Carded Cotton',
        composition: '100% Organic Ring-Spun Cotton',
        country_of_origin: 'Portugal',
        care_instructions: 'Machine wash 30°C. Reshape while damp.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 8500, // $85.00
        currency: 'USD',
        stock: 26,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-LS-010-BNE-S', size: 'S', color: 'Concrete Bone', hex: '#E3E2DE', stock: 6 },
          { sku: 'HW-LS-010-BNE-M', size: 'M', color: 'Concrete Bone', hex: '#E3E2DE', stock: 10 },
          { sku: 'HW-LS-010-BLK-L', size: 'L', color: 'Ink Black', hex: '#1B0E0D', stock: 10 }
        ]
      },
      // 11. Mock-Neck Jersey
      {
        sku: 'HW-MN-011',
        slug: 'mock-neck-jersey',
        name: 'Mock-Neck Jersey',
        description: 'Sculptural raised mock collar silhouette constructed from double-mercerised interlock knit with subtle industrial luster.',
        category: 'TOPS',
        categorySlug: 'menswear-tops',
        collectionSlug: 'core-minimalist',
        fit_type: 'RELAXED',
        fabric_weight: '340 GSM Mercerised Interlock Jersey',
        composition: '95% Compact Cotton, 5% Elastane',
        country_of_origin: 'Portugal',
        care_instructions: 'Gentle cold cycle. Dry flat.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 9500, // $95.00
        currency: 'USD',
        stock: 18,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-MN-011-BLK-S', size: 'S', color: 'Ink Black', hex: '#1B0E0D', stock: 5 },
          { sku: 'HW-MN-011-BLK-M', size: 'M', color: 'Ink Black', hex: '#1B0E0D', stock: 8 },
          { sku: 'HW-MN-011-GRY-L', size: 'L', color: 'Ash Grey', hex: '#7D7D7D', stock: 5 }
        ]
      },
      // 12. Double-Pleat Wide Trousers
      {
        sku: 'HW-WT-012',
        slug: 'double-pleat-wide-trousers',
        name: 'Double-Pleat Wide Trousers',
        description: 'High-rise architectural trousers featuring prominent double front pleats, voluminous wide-leg drape, and blind tailored hems.',
        category: 'TAILORING',
        categorySlug: 'menswear-tailoring',
        collectionSlug: 'season-04-brutalist',
        fit_type: 'OVERSIZED',
        fabric_weight: '380 GSM High-Twist Tropical Wool',
        composition: '100% Virgin Worsted Wool',
        country_of_origin: 'Italy',
        care_instructions: 'Dry clean only. Press with damp cloth.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 22000, // $220.00
        currency: 'USD',
        stock: 16,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-WT-012-BLK-S', size: 'S', color: 'Ink Black', hex: '#1B0E0D', stock: 4 },
          { sku: 'HW-WT-012-BLK-M', size: 'M', color: 'Ink Black', hex: '#1B0E0D', stock: 7 },
          { sku: 'HW-WT-012-BNE-L', size: 'L', color: 'Concrete Bone', hex: '#E3E2DE', stock: 5 }
        ]
      },
      // 13. Panelled Cargo Trousers
      {
        sku: 'HW-PC-013',
        slug: 'panelled-cargo-trousers',
        name: 'Panelled Cargo Trousers',
        description: 'Ergonomic panelled leg construction with expandable bellows cargo pockets, integrated ankle cinch straps, and articulated knee darts.',
        category: 'TAILORING',
        categorySlug: 'menswear-tailoring',
        collectionSlug: 'season-04-brutalist',
        fit_type: 'BOXY',
        fabric_weight: '400 GSM Technical Cotton Ripstop',
        composition: '70% Cotton, 30% Polyamide Ripstop',
        country_of_origin: 'Japan',
        care_instructions: 'Machine wash cold inside out. Line dry.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 24000, // $240.00
        currency: 'USD',
        stock: 15,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-PC-013-BLK-S', size: 'S', color: 'Ink Black', hex: '#1B0E0D', stock: 4 },
          { sku: 'HW-PC-013-BLK-M', size: 'M', color: 'Ink Black', hex: '#1B0E0D', stock: 6 },
          { sku: 'HW-PC-013-OLV-L', size: 'L', color: 'Olive Drab', hex: '#4A5340', stock: 5 }
        ]
      },
      // 14. Sculpted Wool Blazer
      {
        sku: 'HW-WB-014',
        slug: 'sculpted-wool-blazer',
        name: 'Sculpted Wool Blazer',
        description: 'Single-breasted architectural jacket with sharp padded shoulders, elongated notch lapels, and concealed horn button placket.',
        category: 'TAILORING',
        categorySlug: 'menswear-tailoring',
        collectionSlug: 'season-04-brutalist',
        fit_type: 'TAILORED',
        fabric_weight: '450 GSM Heavy Melton Wool',
        composition: '90% Melton Wool, 10% Cashmere; 100% Cupro Lining',
        country_of_origin: 'Italy',
        care_instructions: 'Specialist dry clean only. Store on wide wooden hanger.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 46000, // $460.00
        currency: 'USD',
        stock: 10,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-WB-014-BLK-S', size: 'S', color: 'Ink Black', hex: '#1B0E0D', stock: 3 },
          { sku: 'HW-WB-014-BLK-M', size: 'M', color: 'Ink Black', hex: '#1B0E0D', stock: 4 },
          { sku: 'HW-WB-014-BLK-L', size: 'L', color: 'Ink Black', hex: '#1B0E0D', stock: 3 }
        ]
      },
      // 15. Sculpted Rib Knit Top
      {
        sku: 'HW-RK-015',
        slug: 'sculpted-rib-knit-top',
        name: 'Sculpted Rib Knit Top',
        description: 'Engineered rib gradient that contours the torso with a sculpted funnel neckline, elongated sleeves, and integrated thumbhole cuffs.',
        category: 'KNITWEAR',
        categorySlug: 'womenswear-knitwear',
        collectionSlug: 'core-minimalist',
        fit_type: 'TAILORED',
        fabric_weight: '290 GSM Compact Ribbed Knit',
        composition: '75% Extra-Fine Merino Wool, 25% Mulberry Silk',
        country_of_origin: 'Italy',
        care_instructions: 'Hand wash cold with wool detergent. Dry flat.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 14000, // $140.00
        currency: 'USD',
        stock: 15,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-RK-015-BLK-XS', size: 'XS', color: 'Ink Black', hex: '#1B0E0D', stock: 3 },
          { sku: 'HW-RK-015-BLK-S', size: 'S', color: 'Ink Black', hex: '#1B0E0D', stock: 5 },
          { sku: 'HW-RK-015-BNE-M', size: 'M', color: 'Concrete Bone', hex: '#E3E2DE', stock: 4 },
          { sku: 'HW-RK-015-BLK-L', size: 'L', color: 'Ink Black', hex: '#1B0E0D', stock: 3 }
        ]
      },
      // 16. Draped Column Dress
      {
        sku: 'HW-CD-016',
        slug: 'draped-column-dress',
        name: 'Draped Column Dress',
        description: 'Maxi-length columnar silhouette featuring asymmetrical shoulder gathers, weighted fluid drape, and clean raw-edge blind hemline.',
        category: 'DRESSES',
        categorySlug: 'womenswear-dresses',
        collectionSlug: 'season-04-brutalist',
        fit_type: 'RELAXED',
        fabric_weight: '310 GSM Fluid Crepe Silk',
        composition: '100% Heavy Silk Crepe de Chine',
        country_of_origin: 'France',
        care_instructions: 'Dry clean only.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 32000, // $320.00
        currency: 'USD',
        stock: 12,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-CD-016-BLK-XS', size: 'XS', color: 'Ink Black', hex: '#1B0E0D', stock: 3 },
          { sku: 'HW-CD-016-BLK-S', size: 'S', color: 'Ink Black', hex: '#1B0E0D', stock: 4 },
          { sku: 'HW-CD-016-RED-M', size: 'M', color: 'Burnt Red', hex: '#C72A09', stock: 3 },
          { sku: 'HW-CD-016-BLK-L', size: 'L', color: 'Ink Black', hex: '#1B0E0D', stock: 2 }
        ]
      },
      // 17. Cropped Structural Jacket
      {
        sku: 'HW-CJ-017',
        slug: 'cropped-structural-jacket',
        name: 'Cropped Structural Jacket',
        description: 'Sharp cropped waistline balanced by broad boxy shoulders, industrial matte black snap hardware, and stand collar.',
        category: 'OUTERWEAR',
        categorySlug: 'womenswear-knitwear',
        collectionSlug: 'season-04-brutalist',
        fit_type: 'BOXY',
        fabric_weight: '420 GSM Bonded Twill Canvas',
        composition: '80% Virgin Wool, 20% Technical Polyamide',
        country_of_origin: 'Italy',
        care_instructions: 'Specialist dry clean only.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 29000, // $290.00
        currency: 'USD',
        stock: 10,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-CJ-017-BLK-XS', size: 'XS', color: 'Ink Black', hex: '#1B0E0D', stock: 2 },
          { sku: 'HW-CJ-017-BLK-S', size: 'S', color: 'Ink Black', hex: '#1B0E0D', stock: 4 },
          { sku: 'HW-CJ-017-GRY-M', size: 'M', color: 'Ash Grey', hex: '#7D7D7D', stock: 4 }
        ]
      },
      // 18. Wide-Leg Tailored Trousers
      {
        sku: 'HW-WT-018',
        slug: 'womens-wide-leg-trousers',
        name: 'Wide-Leg Tailored Trousers',
        description: 'Floor-skimming high-waisted trousers cut with deep knife pleats, side slash pockets, and clean waistband with concealed hook closure.',
        category: 'TAILORING',
        categorySlug: 'womenswear-dresses',
        collectionSlug: 'season-04-brutalist',
        fit_type: 'OVERSIZED',
        fabric_weight: '360 GSM Wool Gabardine',
        composition: '100% Virgin Wool Gabardine',
        country_of_origin: 'Italy',
        care_instructions: 'Dry clean only. Cool iron.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 21000, // $210.00
        currency: 'USD',
        stock: 14,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-WT-018-BLK-XS', size: 'XS', color: 'Ink Black', hex: '#1B0E0D', stock: 3 },
          { sku: 'HW-WT-018-BLK-S', size: 'S', color: 'Ink Black', hex: '#1B0E0D', stock: 5 },
          { sku: 'HW-WT-018-BNE-M', size: 'M', color: 'Concrete Bone', hex: '#E3E2DE', stock: 4 },
          { sku: 'HW-WT-018-BLK-L', size: 'L', color: 'Ink Black', hex: '#1B0E0D', stock: 2 }
        ]
      },
      // 19. Longline Knit Dress
      {
        sku: 'HW-LK-019',
        slug: 'longline-knit-dress',
        name: 'Longline Knit Dress',
        description: 'Full-length tubular knit dress with subtle right side slit and clean crew neckline crafted from tactile boiled merino wool.',
        category: 'DRESSES',
        categorySlug: 'womenswear-dresses',
        collectionSlug: 'core-minimalist',
        fit_type: 'TAILORED',
        fabric_weight: '350 GSM Fine Gauge Boiled Wool',
        composition: '100% Ultrafine Australian Merino Wool',
        country_of_origin: 'Italy',
        care_instructions: 'Hand wash cold. Dry flat on towel.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 26000, // $260.00
        currency: 'USD',
        stock: 12,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-LK-019-BLK-XS', size: 'XS', color: 'Ink Black', hex: '#1B0E0D', stock: 3 },
          { sku: 'HW-LK-019-BLK-S', size: 'S', color: 'Ink Black', hex: '#1B0E0D', stock: 4 },
          { sku: 'HW-LK-019-GRY-M', size: 'M', color: 'Ash Grey', hex: '#7D7D7D', stock: 3 },
          { sku: 'HW-LK-019-BLK-L', size: 'L', color: 'Ink Black', hex: '#1B0E0D', stock: 2 }
        ]
      },
      // 20. Structured Leather Tote
      {
        sku: 'HW-LT-020',
        slug: 'structured-leather-tote',
        name: 'Structured Leather Tote',
        description: 'Full-grain vegetable-tanned bovine leather tote featuring architectural raw-edge panels and interior laptop compartment.',
        category: 'ACCESSORIES',
        categorySlug: 'accessories',
        collectionSlug: 'industrial-hardware',
        fit_type: 'BOXY',
        fabric_weight: '3.2 mm Saddle-Grade Bridle Leather',
        composition: '100% Vegetable-Tanned Calfskin, Brushed Stainless Hardware',
        country_of_origin: 'Italy',
        care_instructions: 'Condition annually with neutral leather balm.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 48000, // $480.00
        currency: 'USD',
        stock: 8,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-LT-020-BLK-OS', size: 'ONE SIZE', color: 'Ink Black', hex: '#1B0E0D', stock: 8 }
        ]
      },
      // 21. Technical Crossbody Bag
      {
        sku: 'HW-CB-021',
        slug: 'technical-crossbody-bag',
        name: 'Technical Crossbody Bag',
        description: 'Compact modular sling with Fidlock V-buckle magnetic closure, weather-resistant zip compartments, and mil-spec webbing.',
        category: 'ACCESSORIES',
        categorySlug: 'accessories',
        collectionSlug: 'industrial-hardware',
        fit_type: 'BOXY',
        fabric_weight: '1000D Cordura Ballistic Nylon',
        composition: '100% High-Tenacity Cordura, Anodized Aluminum Buckle',
        country_of_origin: 'Japan',
        care_instructions: 'Spot clean with damp cloth.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 14000, // $140.00
        currency: 'USD',
        stock: 18,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-CB-021-BLK-OS', size: 'ONE SIZE', color: 'Ink Black', hex: '#1B0E0D', stock: 12 },
          { sku: 'HW-CB-021-OLV-OS', size: 'ONE SIZE', color: 'Olive Drab', hex: '#4A5340', stock: 6 }
        ]
      },
      // 22. Industrial Buckle Belt
      {
        sku: 'HW-IB-022',
        slug: 'industrial-buckle-belt',
        name: 'Industrial Buckle Belt',
        description: '38mm high-density jacquard webbing paired with a quick-release CNC-machined aerospace alloy buckle with laser-etched serial code.',
        category: 'ACCESSORIES',
        categorySlug: 'accessories',
        collectionSlug: 'industrial-hardware',
        fit_type: 'TAILORED',
        fabric_weight: 'Heavy Duty Mil-Spec Jacquard Webbing',
        composition: '100% Polyamide Webbing, 7075 Anodized Aluminum Hardware',
        country_of_origin: 'Austria',
        care_instructions: 'Wipe metal with dry microfibre cloth.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 11000, // $110.00
        currency: 'USD',
        stock: 22,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-IB-022-BLK-S', size: 'S', color: 'Ink Black', hex: '#1B0E0D', stock: 7 },
          { sku: 'HW-IB-022-BLK-M', size: 'M', color: 'Ink Black', hex: '#1B0E0D', stock: 8 },
          { sku: 'HW-IB-022-RED-L', size: 'L', color: 'Burnt Red', hex: '#C72A09', stock: 7 }
        ]
      },
      // 23. Merino Wrap Scarf
      {
        sku: 'HW-MS-023',
        slug: 'merino-wrap-scarf',
        name: 'Merino Wrap Scarf',
        description: 'Substantial 220cm architectural blanket scarf in ribbed virgin wool with clean selvedge border finish and woven label.',
        category: 'ACCESSORIES',
        categorySlug: 'accessories',
        collectionSlug: 'core-minimalist',
        fit_type: 'OVERSIZED',
        fabric_weight: '480 GSM Double-Rib Heavyweight Knit',
        composition: '100% Extra-Fine Virgin Merino Wool',
        country_of_origin: 'Scotland',
        care_instructions: 'Dry clean or gentle hand wash cold.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 13000, // $130.00
        currency: 'USD',
        stock: 16,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-MS-023-GRY-OS', size: 'ONE SIZE', color: 'Ash Grey', hex: '#7D7D7D', stock: 8 },
          { sku: 'HW-MS-023-BLK-OS', size: 'ONE SIZE', color: 'Ink Black', hex: '#1B0E0D', stock: 8 }
        ]
      },
      // 24. Season 04 Archive Object / Field Notes
      {
        sku: 'HW-FN-024',
        slug: 'season-04-archive-field-notes',
        name: 'Season 04 Archive Field Notes',
        description: 'Numbered edition archival monograph containing brutalist technical line drawings, typography specimens, and raw fabric swatches.',
        category: 'OBJECTS',
        categorySlug: 'objects-archive',
        collectionSlug: 'season-04-brutalist',
        fit_type: 'BOXY',
        fabric_weight: '300 GSM Uncoated Heavyweight Board',
        composition: 'FSC Certified Heavy Cotton Paper, Stainless Steel Screw Binding',
        country_of_origin: 'Germany',
        care_instructions: 'Store in moisture-controlled archive environment.',
        rating_avg: null,
        rating_count: 0,
        price_cents: 4500, // $45.00
        currency: 'USD',
        stock: 35,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop',
        variants: [
          { sku: 'HW-FN-024-STD-OS', size: 'ONE SIZE', color: 'Concrete Bone', hex: '#E3E2DE', stock: 35 }
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

      // Seed Additional Gallery Images
      if ('galleryImages' in p && Array.isArray((p as any).galleryImages)) {
        let sortIdx = 2;
        for (const g of (p as any).galleryImages) {
          await client.query(
            `INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
             VALUES ($1, $2, $3, FALSE, $4)
             ON CONFLICT DO NOTHING;`,
            [productId, g.url, g.alt, sortIdx++]
          );
        }
      }
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
