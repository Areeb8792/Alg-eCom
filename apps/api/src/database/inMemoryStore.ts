import { Product, ProductVariant, ProductImage, Category, Collection } from '../repositories/productRepository.js';
import { Order } from '../repositories/orderRepository.js';
import { AuditEvent } from '../repositories/adminRepository.js';

// ==============================================================================
// Season 04 Hierarchical Categories
// ==============================================================================
export const IN_MEMORY_CATEGORIES: Category[] = [
  {
    id: 'cat-menswear',
    name: 'MENSWEAR',
    slug: 'menswear',
    parent_id: null,
    description: 'Structural masculine tailoring, oversized outerwear and architectural everyday staples.',
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop',
    sort_order: 1,
    is_active: true
  },
  {
    id: 'cat-men-outerwear',
    name: 'Outerwear',
    slug: 'menswear-outerwear',
    parent_id: 'cat-menswear',
    description: 'Technical puffers, modular field coats, and trench architectures.',
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop',
    sort_order: 1,
    is_active: true
  },
  {
    id: 'cat-men-tailoring',
    name: 'Tailoring',
    slug: 'menswear-tailoring',
    parent_id: 'cat-menswear',
    description: 'Double-breasted boxy blazers and pleated architectural trousers.',
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop',
    sort_order: 2,
    is_active: true
  },
  {
    id: 'cat-men-tops',
    name: 'Tops & Jerseys',
    slug: 'menswear-tops',
    parent_id: 'cat-menswear',
    description: 'Heavy selvedge jerseys, dropped shoulder tees, and raw hoodies.',
    image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop',
    sort_order: 3,
    is_active: true
  },
  {
    id: 'cat-womenswear',
    name: 'WOMENSWEAR',
    slug: 'womenswear',
    parent_id: null,
    description: 'Sharp brutalist silhouettes, sculpted knitwear and architectural drape.',
    image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
    sort_order: 2,
    is_active: true
  },
  {
    id: 'cat-women-knitwear',
    name: 'Knitwear',
    slug: 'womenswear-knitwear',
    parent_id: 'cat-womenswear',
    description: 'Heavyweight ribbed merino wool and sculpted cashmere garments.',
    image_url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1000&auto=format&fit=crop',
    sort_order: 1,
    is_active: true
  },
  {
    id: 'cat-women-dresses',
    name: 'Dresses & Drape',
    slug: 'womenswear-dresses',
    parent_id: 'cat-womenswear',
    description: 'Column silhouettes cut from heavy bonded silk and technical nylon.',
    image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop',
    sort_order: 2,
    is_active: true
  },
  {
    id: 'cat-accessories',
    name: 'ACCESSORIES',
    slug: 'accessories',
    parent_id: null,
    description: 'Raw-edged cashmere scarves, industrial hardware and leather objects.',
    image_url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=1000&auto=format&fit=crop',
    sort_order: 3,
    is_active: true
  },
  {
    id: 'cat-objects',
    name: 'OBJECTS & ARCHIVE',
    slug: 'objects-archive',
    parent_id: null,
    description: 'Monographs, industrial artifacts and limited edition hardware.',
    image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop',
    sort_order: 4,
    is_active: true
  }
];

// ==============================================================================
// Season 04 Editorial Collections
// ==============================================================================
export const IN_MEMORY_COLLECTIONS: Collection[] = [
  {
    id: 'col-s04',
    name: 'Season 04 // Brutalist Heavy',
    slug: 'season-04-brutalist',
    tagline: 'Raw architectural form, industrial materiality, unyielding silhouette',
    description: 'The definitive Season 04 collection explores monolithic tailoring, 650GSM selvedge cottons and weatherproof technical silk down fill.',
    editorial_banner_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1600&auto=format&fit=crop',
    is_featured: true,
    sort_order: 1
  },
  {
    id: 'col-mono',
    name: 'Monochrome Archive',
    slug: 'monochrome-archive',
    tagline: 'The definitive black, concrete and bone uniform',
    description: 'Curated archive of timeless silhouettes rendered strictly in high-contrast Ink Black, Concrete Bone and Ash Grey.',
    editorial_banner_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop',
    is_featured: true,
    sort_order: 2
  },
  {
    id: 'col-core',
    name: 'Core Minimalist',
    slug: 'core-minimalist',
    tagline: 'Architectural essentials engineered for daily rotation',
    description: 'Foundational wardrobe garments engineered with hand-finished bindings, dropped shoulders and heavyweight Japanese selvedge weaves.',
    editorial_banner_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1600&auto=format&fit=crop',
    is_featured: false,
    sort_order: 3
  }
];

// ==============================================================================
// Season 04 Product Catalogue with Variants & Multi-Image Editorial Gallery
// ==============================================================================
export const IN_MEMORY_PRODUCTS: Product[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    sku: 'HW-PF-001',
    slug: 'statement-puffer',
    name: 'Statement Puffer',
    description: 'Silk blend outer shell with technical down fill. Features brutalist minimalist lines, high standing collar, and hidden storm closures.',
    category: 'OUTERWEAR',
    category_id: 'cat-men-outerwear',
    collection_id: 'col-s04',
    collection_name: 'Season 04 // Brutalist Heavy',
    collection_slug: 'season-04-brutalist',
    fit_type: 'OVERSIZED',
    fabric_weight: '750 GSM Technical Shell',
    composition: '60% Japanese Mulberry Silk, 40% High-Tenacity Cordura Nylon / Fill: 90% White Goose Down, 10% Feather',
    country_of_origin: 'Made in Tokyo, Japan',
    care_instructions: 'Specialist dry clean only. Store in provided archival dust bag.',
    rating_avg: 4.9,
    rating_count: 28,
    price_cents: 14000,
    currency: 'USD',
    stock: 15,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-pf-1', product_id: '550e8400-e29b-41d4-a716-446655440001', sku: 'HW-PF-001-BLK-S', size: 'S', color: 'Ink Black', color_hex: '#1B0E0D', stock: 4, is_active: true },
      { id: 'v-pf-2', product_id: '550e8400-e29b-41d4-a716-446655440001', sku: 'HW-PF-001-BLK-M', size: 'M', color: 'Ink Black', color_hex: '#1B0E0D', stock: 6, is_active: true },
      { id: 'v-pf-3', product_id: '550e8400-e29b-41d4-a716-446655440001', sku: 'HW-PF-001-BLK-L', size: 'L', color: 'Ink Black', color_hex: '#1B0E0D', stock: 3, is_active: true },
      { id: 'v-pf-4', product_id: '550e8400-e29b-41d4-a716-446655440001', sku: 'HW-PF-001-GRY-M', size: 'M', color: 'Ash Grey', color_hex: '#7D7D7D', stock: 2, is_active: true }
    ],
    images: [
      { id: 'img-pf-1', product_id: '550e8400-e29b-41d4-a716-446655440001', image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop', alt_text: 'Statement Puffer Front View', is_primary: true, sort_order: 1 },
      { id: 'img-pf-2', product_id: '550e8400-e29b-41d4-a716-446655440001', image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop', alt_text: 'Statement Puffer Detail Back', is_primary: false, sort_order: 2 },
      { id: 'img-pf-3', product_id: '550e8400-e29b-41d4-a716-446655440001', image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop', alt_text: 'Statement Puffer Editorial Context', is_primary: false, sort_order: 3 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    sku: 'HW-TE-002',
    slug: 'minimalist-tee',
    name: 'Minimalist Tee',
    description: 'Heavyweight organic cotton jersey with hand-finished collar binding, boxy drape, and dropped shoulder construction.',
    category: 'TOPS',
    category_id: 'cat-men-tops',
    collection_id: 'col-core',
    collection_name: 'Core Minimalist',
    collection_slug: 'core-minimalist',
    fit_type: 'BOXY',
    fabric_weight: '340 GSM Heavy Jersey',
    composition: '100% GOTS-Certified Organic Aegean Cotton',
    country_of_origin: 'Made in Porto, Portugal',
    care_instructions: 'Machine wash cold inside out with like colors. Flat air dry. Warm iron if needed.',
    rating_avg: 4.8,
    rating_count: 42,
    price_cents: 6500,
    currency: 'USD',
    stock: 30,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-te-1', product_id: '550e8400-e29b-41d4-a716-446655440002', sku: 'HW-TE-002-WHT-S', size: 'S', color: 'Concrete Bone', color_hex: '#E3E2DE', stock: 8, is_active: true },
      { id: 'v-te-2', product_id: '550e8400-e29b-41d4-a716-446655440002', sku: 'HW-TE-002-WHT-M', size: 'M', color: 'Concrete Bone', color_hex: '#E3E2DE', stock: 12, is_active: true },
      { id: 'v-te-3', product_id: '550e8400-e29b-41d4-a716-446655440002', sku: 'HW-TE-002-WHT-L', size: 'L', color: 'Concrete Bone', color_hex: '#E3E2DE', stock: 6, is_active: true },
      { id: 'v-te-4', product_id: '550e8400-e29b-41d4-a716-446655440002', sku: 'HW-TE-002-BLK-M', size: 'M', color: 'Ink Black', color_hex: '#1B0E0D', stock: 4, is_active: true }
    ],
    images: [
      { id: 'img-te-1', product_id: '550e8400-e29b-41d4-a716-446655440002', image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop', alt_text: 'Minimalist Tee Front', is_primary: true, sort_order: 1 },
      { id: 'img-te-2', product_id: '550e8400-e29b-41d4-a716-446655440002', image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop', alt_text: 'Minimalist Tee Drape Texture', is_primary: false, sort_order: 2 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    sku: 'HW-BL-003',
    slug: 'oversized-blazer',
    name: 'Oversized Blazer',
    description: 'Structured wool-blend silhouette with sharp padded shoulders, concealed double-breasted horn buttons, and breathable cupro lining.',
    category: 'TAILORING',
    category_id: 'cat-men-tailoring',
    collection_id: 'col-mono',
    collection_name: 'Monochrome Archive',
    collection_slug: 'monochrome-archive',
    fit_type: 'OVERSIZED',
    fabric_weight: '480 GSM Double-Faced Wool',
    composition: '85% Super 130s Virgin Wool, 15% Cashmere / Lining: 100% Cupro Bemberg',
    country_of_origin: 'Made in Biella, Italy',
    care_instructions: 'Strictly dry clean. Cool iron under press cloth.',
    rating_avg: 5.0,
    rating_count: 19,
    price_cents: 21000,
    currency: 'USD',
    stock: 10,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-bl-1', product_id: '550e8400-e29b-41d4-a716-446655440003', sku: 'HW-BL-003-BLK-S', size: 'S', color: 'Ink Black', color_hex: '#1B0E0D', stock: 2, is_active: true },
      { id: 'v-bl-2', product_id: '550e8400-e29b-41d4-a716-446655440003', sku: 'HW-BL-003-BLK-M', size: 'M', color: 'Ink Black', color_hex: '#1B0E0D', stock: 5, is_active: true },
      { id: 'v-bl-3', product_id: '550e8400-e29b-41d4-a716-446655440003', sku: 'HW-BL-003-BLK-L', size: 'L', color: 'Ink Black', color_hex: '#1B0E0D', stock: 3, is_active: true }
    ],
    images: [
      { id: 'img-bl-1', product_id: '550e8400-e29b-41d4-a716-446655440003', image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop', alt_text: 'Oversized Blazer Front Profile', is_primary: true, sort_order: 1 },
      { id: 'img-bl-2', product_id: '550e8400-e29b-41d4-a716-446655440003', image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop', alt_text: 'Oversized Blazer Lapel Precision', is_primary: false, sort_order: 2 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    sku: 'HW-TR-004',
    slug: 'tailored-silhouette',
    name: 'Tailored Silhouette Trousers',
    description: 'High-waisted relaxed trouser cut with double inverted front pleats, horn adjusters at the waistband, and deep front slash pockets.',
    category: 'TAILORING',
    category_id: 'cat-men-tailoring',
    collection_id: 'col-mono',
    collection_name: 'Monochrome Archive',
    collection_slug: 'monochrome-archive',
    fit_type: 'TAILORED',
    fabric_weight: '380 GSM Organic Linen-Wool',
    composition: '55% Organic Linen, 45% Fine Merino Wool',
    country_of_origin: 'Made in Milan, Italy',
    care_instructions: 'Dry clean only. Steam refresh recommended.',
    rating_avg: 4.7,
    rating_count: 14,
    price_cents: 18000,
    currency: 'USD',
    stock: 18,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-tr-1', product_id: '550e8400-e29b-41d4-a716-446655440004', sku: 'HW-TR-004-GRY-S', size: 'S', color: 'Ash Grey', color_hex: '#7D7D7D', stock: 4, is_active: true },
      { id: 'v-tr-2', product_id: '550e8400-e29b-41d4-a716-446655440004', sku: 'HW-TR-004-GRY-M', size: 'M', color: 'Ash Grey', color_hex: '#7D7D7D', stock: 8, is_active: true },
      { id: 'v-tr-3', product_id: '550e8400-e29b-41d4-a716-446655440004', sku: 'HW-TR-004-GRY-L', size: 'L', color: 'Ash Grey', color_hex: '#7D7D7D', stock: 6, is_active: true }
    ],
    images: [
      { id: 'img-tr-1', product_id: '550e8400-e29b-41d4-a716-446655440004', image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop', alt_text: 'Tailored Silhouette Trousers Studio', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    sku: 'HW-AC-005',
    slug: 'silk-blend-scarf',
    name: 'Silk Blend Monogram Scarf',
    description: 'Raw-edged lightweight cashmere silk jacquard with subtle brutalist architectural typographic motif along border.',
    category: 'ACCESSORIES',
    category_id: 'cat-accessories',
    collection_id: 'col-core',
    collection_name: 'Core Minimalist',
    collection_slug: 'core-minimalist',
    fit_type: 'RELAXED',
    fabric_weight: '180 GSM Raw Weave',
    composition: '70% Mongolian Cashmere, 30% Mulberry Silk',
    country_of_origin: 'Made in Como, Italy',
    care_instructions: 'Hand wash cold with gentle detergent or delicate dry clean.',
    rating_avg: 4.9,
    rating_count: 36,
    price_cents: 8500,
    currency: 'USD',
    stock: 22,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-sc-1', product_id: '550e8400-e29b-41d4-a716-446655440005', sku: 'HW-AC-005-BLK-OS', size: 'ONE_SIZE', color: 'Ink Black', color_hex: '#1B0E0D', stock: 12, is_active: true },
      { id: 'v-sc-2', product_id: '550e8400-e29b-41d4-a716-446655440005', sku: 'HW-AC-005-BNE-OS', size: 'ONE_SIZE', color: 'Concrete Bone', color_hex: '#E3E2DE', stock: 10, is_active: true }
    ],
    images: [
      { id: 'img-sc-1', product_id: '550e8400-e29b-41d4-a716-446655440005', image_url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=1000&auto=format&fit=crop', alt_text: 'Silk Blend Scarf Editorial', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    sku: 'HW-FC-006',
    slug: 'technical-field-coat',
    name: 'Technical Field Coat',
    description: 'Weather-repellent matte nylon shell with modular magnetic utility pockets, stowaway storm hood and brutalist taped seams.',
    category: 'OUTERWEAR',
    category_id: 'cat-men-outerwear',
    collection_id: 'col-s04',
    collection_name: 'Season 04 // Brutalist Heavy',
    collection_slug: 'season-04-brutalist',
    fit_type: 'OVERSIZED',
    fabric_weight: '520 GSM 3-Layer Laminate',
    composition: '100% Recycled Technical Polyamide with PTFE Membrane',
    country_of_origin: 'Made in Tokyo, Japan',
    care_instructions: 'Wipe clean with damp cloth. Machine wash gentle cold cycle.',
    rating_avg: 5.0,
    rating_count: 22,
    price_cents: 32000,
    currency: 'USD',
    stock: 6,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-fc-1', product_id: '550e8400-e29b-41d4-a716-446655440006', sku: 'HW-FC-006-BLK-M', size: 'M', color: 'Ink Black', color_hex: '#1B0E0D', stock: 3, is_active: true },
      { id: 'v-fc-2', product_id: '550e8400-e29b-41d4-a716-446655440006', sku: 'HW-FC-006-BLK-L', size: 'L', color: 'Ink Black', color_hex: '#1B0E0D', stock: 3, is_active: true }
    ],
    images: [
      { id: 'img-fc-1', product_id: '550e8400-e29b-41d4-a716-446655440006', image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop', alt_text: 'Technical Field Coat Full Length', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    sku: 'HW-MJ-007',
    slug: 'modular-field-jacket',
    name: 'Modular Field Jacket',
    description: 'Triple-layer bonded storm shell with detachable magnetic cargo compartments, articulated sleeves, and tactical storm collar.',
    category: 'OUTERWEAR',
    category_id: 'cat-men-outerwear',
    collection_id: 'col-s04',
    collection_name: 'Season 04 // Brutalist Heavy',
    collection_slug: 'season-04-brutalist',
    fit_type: 'OVERSIZED',
    fabric_weight: '480 GSM Waterproof Matte Ripstop',
    composition: '85% Technical Polyamide, 15% Elastane with PTFE Membrane',
    country_of_origin: 'Made in Japan',
    care_instructions: 'Machine wash cold delicate cycle. Hang to dry in shade.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 34000,
    currency: 'USD',
    stock: 14,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-mj-1', product_id: '550e8400-e29b-41d4-a716-446655440007', sku: 'HW-MJ-007-BLK-S', size: 'S', color: 'Ink Black', color_hex: '#1B0E0D', stock: 4, is_active: true },
      { id: 'v-mj-2', product_id: '550e8400-e29b-41d4-a716-446655440007', sku: 'HW-MJ-007-BLK-M', size: 'M', color: 'Ink Black', color_hex: '#1B0E0D', stock: 6, is_active: true },
      { id: 'v-mj-3', product_id: '550e8400-e29b-41d4-a716-446655440007', sku: 'HW-MJ-007-BLK-L', size: 'L', color: 'Ink Black', color_hex: '#1B0E0D', stock: 4, is_active: true }
    ],
    images: [
      { id: 'img-mj-1', product_id: '550e8400-e29b-41d4-a716-446655440007', image_url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=1000&auto=format&fit=crop', alt_text: 'Modular Field Jacket Front View', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    sku: 'HW-SP-008',
    slug: 'technical-shell-parka',
    name: 'Technical Shell Parka',
    description: 'Floor-sweeping weatherproof parka engineered with articulated shoulder geometry, waterproof taped seams, and fishtail drawcord.',
    category: 'OUTERWEAR',
    category_id: 'cat-men-outerwear',
    collection_id: 'col-s04',
    collection_name: 'Season 04 // Brutalist Heavy',
    collection_slug: 'season-04-brutalist',
    fit_type: 'OVERSIZED',
    fabric_weight: '420 GSM 3-Layer Technical Twill',
    composition: '100% Recycled Nylon Shell, Sealed Breathable Membrane',
    country_of_origin: 'Made in Italy',
    care_instructions: 'Specialist membrane clean only.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 38000,
    currency: 'USD',
    stock: 12,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-sp-1', product_id: '550e8400-e29b-41d4-a716-446655440008', sku: 'HW-SP-008-BLK-S', size: 'S', color: 'Ink Black', color_hex: '#1B0E0D', stock: 3, is_active: true },
      { id: 'v-sp-2', product_id: '550e8400-e29b-41d4-a716-446655440008', sku: 'HW-SP-008-BLK-M', size: 'M', color: 'Ink Black', color_hex: '#1B0E0D', stock: 5, is_active: true },
      { id: 'v-sp-3', product_id: '550e8400-e29b-41d4-a716-446655440008', sku: 'HW-SP-008-GRY-L', size: 'L', color: 'Ash Grey', color_hex: '#7D7D7D', stock: 4, is_active: true }
    ],
    images: [
      { id: 'img-sp-1', product_id: '550e8400-e29b-41d4-a716-446655440008', image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop', alt_text: 'Technical Shell Parka Front', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    sku: 'HW-UO-009',
    slug: 'utility-overshirt',
    name: 'Utility Overshirt',
    description: 'Structured heavy cotton twill shirt jacket featuring concealed horn buttons, reinforced elbow patches, and dual drop-entry chest pockets.',
    category: 'TOPS',
    category_id: 'cat-men-tops',
    collection_id: 'col-core',
    collection_name: 'Core Minimalist',
    collection_slug: 'core-minimalist',
    fit_type: 'BOXY',
    fabric_weight: '360 GSM Heavy Milled Twill',
    composition: '100% Combed Compact Cotton',
    country_of_origin: 'Made in Portugal',
    care_instructions: 'Machine wash cold 30°C. Warm iron on reverse.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 16500,
    currency: 'USD',
    stock: 20,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-uo-1', product_id: '550e8400-e29b-41d4-a716-446655440009', sku: 'HW-UO-009-BLK-S', size: 'S', color: 'Ink Black', color_hex: '#1B0E0D', stock: 5, is_active: true },
      { id: 'v-uo-2', product_id: '550e8400-e29b-41d4-a716-446655440009', sku: 'HW-UO-009-BLK-M', size: 'M', color: 'Ink Black', color_hex: '#1B0E0D', stock: 8, is_active: true },
      { id: 'v-uo-3', product_id: '550e8400-e29b-41d4-a716-446655440009', sku: 'HW-UO-009-OLV-L', size: 'L', color: 'Olive Drab', color_hex: '#4A5340', stock: 7, is_active: true }
    ],
    images: [
      { id: 'img-uo-1', product_id: '550e8400-e29b-41d4-a716-446655440009', image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop', alt_text: 'Utility Overshirt', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    sku: 'HW-LS-010',
    slug: 'heavyweight-long-sleeve-tee',
    name: 'Heavyweight Long Sleeve Tee',
    description: 'Dense double-jersey knit with ribbed mock cuffs, pronounced dropped shoulders, and seamless tubular torso construction.',
    category: 'TOPS',
    category_id: 'cat-men-tops',
    collection_id: 'col-core',
    collection_name: 'Core Minimalist',
    collection_slug: 'core-minimalist',
    fit_type: 'BOXY',
    fabric_weight: '380 GSM Heavyweight Carded Cotton',
    composition: '100% Organic Ring-Spun Cotton',
    country_of_origin: 'Made in Portugal',
    care_instructions: 'Machine wash 30°C. Reshape while damp.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 8500,
    currency: 'USD',
    stock: 26,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-ls-1', product_id: '550e8400-e29b-41d4-a716-446655440010', sku: 'HW-LS-010-BNE-S', size: 'S', color: 'Concrete Bone', color_hex: '#E3E2DE', stock: 6, is_active: true },
      { id: 'v-ls-2', product_id: '550e8400-e29b-41d4-a716-446655440010', sku: 'HW-LS-010-BNE-M', size: 'M', color: 'Concrete Bone', color_hex: '#E3E2DE', stock: 10, is_active: true },
      { id: 'v-ls-3', product_id: '550e8400-e29b-41d4-a716-446655440010', sku: 'HW-LS-010-BLK-L', size: 'L', color: 'Ink Black', color_hex: '#1B0E0D', stock: 10, is_active: true }
    ],
    images: [
      { id: 'img-ls-1', product_id: '550e8400-e29b-41d4-a716-446655440010', image_url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop', alt_text: 'Heavyweight Long Sleeve Tee', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    sku: 'HW-MN-011',
    slug: 'mock-neck-jersey',
    name: 'Mock-Neck Jersey',
    description: 'Sculptural raised mock collar silhouette constructed from double-mercerised interlock knit with subtle industrial luster.',
    category: 'TOPS',
    category_id: 'cat-men-tops',
    collection_id: 'col-core',
    collection_name: 'Core Minimalist',
    collection_slug: 'core-minimalist',
    fit_type: 'RELAXED',
    fabric_weight: '340 GSM Mercerised Interlock Jersey',
    composition: '95% Compact Cotton, 5% Elastane',
    country_of_origin: 'Made in Portugal',
    care_instructions: 'Gentle cold cycle. Dry flat.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 9500,
    currency: 'USD',
    stock: 18,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-mn-1', product_id: '550e8400-e29b-41d4-a716-446655440011', sku: 'HW-MN-011-BLK-S', size: 'S', color: 'Ink Black', color_hex: '#1B0E0D', stock: 5, is_active: true },
      { id: 'v-mn-2', product_id: '550e8400-e29b-41d4-a716-446655440011', sku: 'HW-MN-011-BLK-M', size: 'M', color: 'Ink Black', color_hex: '#1B0E0D', stock: 8, is_active: true },
      { id: 'v-mn-3', product_id: '550e8400-e29b-41d4-a716-446655440011', sku: 'HW-MN-011-GRY-L', size: 'L', color: 'Ash Grey', color_hex: '#7D7D7D', stock: 5, is_active: true }
    ],
    images: [
      { id: 'img-mn-1', product_id: '550e8400-e29b-41d4-a716-446655440011', image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop', alt_text: 'Mock-Neck Jersey', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    sku: 'HW-WT-012',
    slug: 'double-pleat-wide-trousers',
    name: 'Double-Pleat Wide Trousers',
    description: 'High-rise architectural trousers featuring prominent double front pleats, voluminous wide-leg drape, and blind tailored hems.',
    category: 'TAILORING',
    category_id: 'cat-men-tailoring',
    collection_id: 'col-s04',
    collection_name: 'Season 04 // Brutalist Heavy',
    collection_slug: 'season-04-brutalist',
    fit_type: 'OVERSIZED',
    fabric_weight: '380 GSM High-Twist Tropical Wool',
    composition: '100% Virgin Worsted Wool',
    country_of_origin: 'Made in Italy',
    care_instructions: 'Dry clean only. Press with damp cloth.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 22000,
    currency: 'USD',
    stock: 16,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-wt-1', product_id: '550e8400-e29b-41d4-a716-446655440012', sku: 'HW-WT-012-BLK-S', size: 'S', color: 'Ink Black', color_hex: '#1B0E0D', stock: 4, is_active: true },
      { id: 'v-wt-2', product_id: '550e8400-e29b-41d4-a716-446655440012', sku: 'HW-WT-012-BLK-M', size: 'M', color: 'Ink Black', color_hex: '#1B0E0D', stock: 7, is_active: true },
      { id: 'v-wt-3', product_id: '550e8400-e29b-41d4-a716-446655440012', sku: 'HW-WT-012-BNE-L', size: 'L', color: 'Concrete Bone', color_hex: '#E3E2DE', stock: 5, is_active: true }
    ],
    images: [
      { id: 'img-wt-1', product_id: '550e8400-e29b-41d4-a716-446655440012', image_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000&auto=format&fit=crop', alt_text: 'Double-Pleat Wide Trousers', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    sku: 'HW-PC-013',
    slug: 'panelled-cargo-trousers',
    name: 'Panelled Cargo Trousers',
    description: 'Ergonomic panelled leg construction with expandable bellows cargo pockets, integrated ankle cinch straps, and articulated knee darts.',
    category: 'TAILORING',
    category_id: 'cat-men-tailoring',
    collection_id: 'col-s04',
    collection_name: 'Season 04 // Brutalist Heavy',
    collection_slug: 'season-04-brutalist',
    fit_type: 'BOXY',
    fabric_weight: '400 GSM Technical Cotton Ripstop',
    composition: '70% Cotton, 30% Polyamide Ripstop',
    country_of_origin: 'Made in Japan',
    care_instructions: 'Machine wash cold inside out. Line dry.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 24000,
    currency: 'USD',
    stock: 15,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-pc-1', product_id: '550e8400-e29b-41d4-a716-446655440013', sku: 'HW-PC-013-BLK-S', size: 'S', color: 'Ink Black', color_hex: '#1B0E0D', stock: 4, is_active: true },
      { id: 'v-pc-2', product_id: '550e8400-e29b-41d4-a716-446655440013', sku: 'HW-PC-013-BLK-M', size: 'M', color: 'Ink Black', color_hex: '#1B0E0D', stock: 6, is_active: true },
      { id: 'v-pc-3', product_id: '550e8400-e29b-41d4-a716-446655440013', sku: 'HW-PC-013-OLV-L', size: 'L', color: 'Olive Drab', color_hex: '#4A5340', stock: 5, is_active: true }
    ],
    images: [
      { id: 'img-pc-1', product_id: '550e8400-e29b-41d4-a716-446655440013', image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop', alt_text: 'Panelled Cargo Trousers', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440014',
    sku: 'HW-WB-014',
    slug: 'sculpted-wool-blazer',
    name: 'Sculpted Wool Blazer',
    description: 'Single-breasted architectural jacket with sharp padded shoulders, elongated notch lapels, and concealed horn button placket.',
    category: 'TAILORING',
    category_id: 'cat-men-tailoring',
    collection_id: 'col-s04',
    collection_name: 'Season 04 // Brutalist Heavy',
    collection_slug: 'season-04-brutalist',
    fit_type: 'TAILORED',
    fabric_weight: '450 GSM Heavy Melton Wool',
    composition: '90% Melton Wool, 10% Cashmere; 100% Cupro Lining',
    country_of_origin: 'Made in Italy',
    care_instructions: 'Specialist dry clean only. Store on wide wooden hanger.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 46000,
    currency: 'USD',
    stock: 10,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-wb-1', product_id: '550e8400-e29b-41d4-a716-446655440014', sku: 'HW-WB-014-BLK-S', size: 'S', color: 'Ink Black', color_hex: '#1B0E0D', stock: 3, is_active: true },
      { id: 'v-wb-2', product_id: '550e8400-e29b-41d4-a716-446655440014', sku: 'HW-WB-014-BLK-M', size: 'M', color: 'Ink Black', color_hex: '#1B0E0D', stock: 4, is_active: true },
      { id: 'v-wb-3', product_id: '550e8400-e29b-41d4-a716-446655440014', sku: 'HW-WB-014-BLK-L', size: 'L', color: 'Ink Black', color_hex: '#1B0E0D', stock: 3, is_active: true }
    ],
    images: [
      { id: 'img-wb-1', product_id: '550e8400-e29b-41d4-a716-446655440014', image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop', alt_text: 'Sculpted Wool Blazer', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440015',
    sku: 'HW-RK-015',
    slug: 'sculpted-rib-knit-top',
    name: 'Sculpted Rib Knit Top',
    description: 'Engineered rib gradient that contours the torso with a sculpted funnel neckline, elongated sleeves, and integrated thumbhole cuffs.',
    category: 'KNITWEAR',
    category_id: 'cat-women-knitwear',
    collection_id: 'col-core',
    collection_name: 'Core Minimalist',
    collection_slug: 'core-minimalist',
    fit_type: 'TAILORED',
    fabric_weight: '290 GSM Compact Ribbed Knit',
    composition: '75% Extra-Fine Merino Wool, 25% Mulberry Silk',
    country_of_origin: 'Made in Italy',
    care_instructions: 'Hand wash cold with wool detergent. Dry flat.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 14000,
    currency: 'USD',
    stock: 15,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-rk-1', product_id: '550e8400-e29b-41d4-a716-446655440015', sku: 'HW-RK-015-BLK-XS', size: 'XS', color: 'Ink Black', color_hex: '#1B0E0D', stock: 3, is_active: true },
      { id: 'v-rk-2', product_id: '550e8400-e29b-41d4-a716-446655440015', sku: 'HW-RK-015-BLK-S', size: 'S', color: 'Ink Black', color_hex: '#1B0E0D', stock: 5, is_active: true },
      { id: 'v-rk-3', product_id: '550e8400-e29b-41d4-a716-446655440015', sku: 'HW-RK-015-BNE-M', size: 'M', color: 'Concrete Bone', color_hex: '#E3E2DE', stock: 4, is_active: true },
      { id: 'v-rk-4', product_id: '550e8400-e29b-41d4-a716-446655440015', sku: 'HW-RK-015-BLK-L', size: 'L', color: 'Ink Black', color_hex: '#1B0E0D', stock: 3, is_active: true }
    ],
    images: [
      { id: 'img-rk-1', product_id: '550e8400-e29b-41d4-a716-446655440015', image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop', alt_text: 'Sculpted Rib Knit Top', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440016',
    sku: 'HW-CD-016',
    slug: 'draped-column-dress',
    name: 'Draped Column Dress',
    description: 'Maxi-length columnar silhouette featuring asymmetrical shoulder gathers, weighted fluid drape, and clean raw-edge blind hemline.',
    category: 'DRESSES',
    category_id: 'cat-women-dresses',
    collection_id: 'col-s04',
    collection_name: 'Season 04 // Brutalist Heavy',
    collection_slug: 'season-04-brutalist',
    fit_type: 'RELAXED',
    fabric_weight: '310 GSM Fluid Crepe Silk',
    composition: '100% Heavy Silk Crepe de Chine',
    country_of_origin: 'Made in France',
    care_instructions: 'Dry clean only.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 32000,
    currency: 'USD',
    stock: 12,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-cd-1', product_id: '550e8400-e29b-41d4-a716-446655440016', sku: 'HW-CD-016-BLK-XS', size: 'XS', color: 'Ink Black', color_hex: '#1B0E0D', stock: 3, is_active: true },
      { id: 'v-cd-2', product_id: '550e8400-e29b-41d4-a716-446655440016', sku: 'HW-CD-016-BLK-S', size: 'S', color: 'Ink Black', color_hex: '#1B0E0D', stock: 4, is_active: true },
      { id: 'v-cd-3', product_id: '550e8400-e29b-41d4-a716-446655440016', sku: 'HW-CD-016-RED-M', size: 'M', color: 'Burnt Red', color_hex: '#C72A09', stock: 3, is_active: true },
      { id: 'v-cd-4', product_id: '550e8400-e29b-41d4-a716-446655440016', sku: 'HW-CD-016-BLK-L', size: 'L', color: 'Ink Black', color_hex: '#1B0E0D', stock: 2, is_active: true }
    ],
    images: [
      { id: 'img-cd-1', product_id: '550e8400-e29b-41d4-a716-446655440016', image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop', alt_text: 'Draped Column Dress', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440017',
    sku: 'HW-CJ-017',
    slug: 'cropped-structural-jacket',
    name: 'Cropped Structural Jacket',
    description: 'Sharp cropped waistline balanced by broad boxy shoulders, industrial matte black snap hardware, and stand collar.',
    category: 'OUTERWEAR',
    category_id: 'cat-women-knitwear',
    collection_id: 'col-s04',
    collection_name: 'Season 04 // Brutalist Heavy',
    collection_slug: 'season-04-brutalist',
    fit_type: 'BOXY',
    fabric_weight: '420 GSM Bonded Twill Canvas',
    composition: '80% Virgin Wool, 20% Technical Polyamide',
    country_of_origin: 'Made in Italy',
    care_instructions: 'Specialist dry clean only.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 29000,
    currency: 'USD',
    stock: 10,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-cj-1', product_id: '550e8400-e29b-41d4-a716-446655440017', sku: 'HW-CJ-017-BLK-XS', size: 'XS', color: 'Ink Black', color_hex: '#1B0E0D', stock: 2, is_active: true },
      { id: 'v-cj-2', product_id: '550e8400-e29b-41d4-a716-446655440017', sku: 'HW-CJ-017-BLK-S', size: 'S', color: 'Ink Black', color_hex: '#1B0E0D', stock: 4, is_active: true },
      { id: 'v-cj-3', product_id: '550e8400-e29b-41d4-a716-446655440017', sku: 'HW-CJ-017-GRY-M', size: 'M', color: 'Ash Grey', color_hex: '#7D7D7D', stock: 4, is_active: true }
    ],
    images: [
      { id: 'img-cj-1', product_id: '550e8400-e29b-41d4-a716-446655440017', image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop', alt_text: 'Cropped Structural Jacket', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440018',
    sku: 'HW-WT-018',
    slug: 'womens-wide-leg-trousers',
    name: 'Wide-Leg Tailored Trousers',
    description: 'Floor-skimming high-waisted trousers cut with deep knife pleats, side slash pockets, and clean waistband with concealed hook closure.',
    category: 'TAILORING',
    category_id: 'cat-women-dresses',
    collection_id: 'col-s04',
    collection_name: 'Season 04 // Brutalist Heavy',
    collection_slug: 'season-04-brutalist',
    fit_type: 'OVERSIZED',
    fabric_weight: '360 GSM Wool Gabardine',
    composition: '100% Virgin Wool Gabardine',
    country_of_origin: 'Made in Italy',
    care_instructions: 'Dry clean only. Cool iron.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 21000,
    currency: 'USD',
    stock: 14,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-wwt-1', product_id: '550e8400-e29b-41d4-a716-446655440018', sku: 'HW-WT-018-BLK-XS', size: 'XS', color: 'Ink Black', color_hex: '#1B0E0D', stock: 3, is_active: true },
      { id: 'v-wwt-2', product_id: '550e8400-e29b-41d4-a716-446655440018', sku: 'HW-WT-018-BLK-S', size: 'S', color: 'Ink Black', color_hex: '#1B0E0D', stock: 5, is_active: true },
      { id: 'v-wwt-3', product_id: '550e8400-e29b-41d4-a716-446655440018', sku: 'HW-WT-018-BNE-M', size: 'M', color: 'Concrete Bone', color_hex: '#E3E2DE', stock: 4, is_active: true },
      { id: 'v-wwt-4', product_id: '550e8400-e29b-41d4-a716-446655440018', sku: 'HW-WT-018-BLK-L', size: 'L', color: 'Ink Black', color_hex: '#1B0E0D', stock: 2, is_active: true }
    ],
    images: [
      { id: 'img-wwt-1', product_id: '550e8400-e29b-41d4-a716-446655440018', image_url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000&auto=format&fit=crop', alt_text: 'Wide-Leg Tailored Trousers', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440019',
    sku: 'HW-LK-019',
    slug: 'longline-knit-dress',
    name: 'Longline Knit Dress',
    description: 'Full-length tubular knit dress with subtle right side slit and clean crew neckline crafted from tactile boiled merino wool.',
    category: 'DRESSES',
    category_id: 'cat-women-dresses',
    collection_id: 'col-core',
    collection_name: 'Core Minimalist',
    collection_slug: 'core-minimalist',
    fit_type: 'TAILORED',
    fabric_weight: '350 GSM Fine Gauge Boiled Wool',
    composition: '100% Ultrafine Australian Merino Wool',
    country_of_origin: 'Made in Italy',
    care_instructions: 'Hand wash cold. Dry flat on towel.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 26000,
    currency: 'USD',
    stock: 12,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-lk-1', product_id: '550e8400-e29b-41d4-a716-446655440019', sku: 'HW-LK-019-BLK-XS', size: 'XS', color: 'Ink Black', color_hex: '#1B0E0D', stock: 3, is_active: true },
      { id: 'v-lk-2', product_id: '550e8400-e29b-41d4-a716-446655440019', sku: 'HW-LK-019-BLK-S', size: 'S', color: 'Ink Black', color_hex: '#1B0E0D', stock: 4, is_active: true },
      { id: 'v-lk-3', product_id: '550e8400-e29b-41d4-a716-446655440019', sku: 'HW-LK-019-GRY-M', size: 'M', color: 'Ash Grey', color_hex: '#7D7D7D', stock: 3, is_active: true },
      { id: 'v-lk-4', product_id: '550e8400-e29b-41d4-a716-446655440019', sku: 'HW-LK-019-BLK-L', size: 'L', color: 'Ink Black', color_hex: '#1B0E0D', stock: 2, is_active: true }
    ],
    images: [
      { id: 'img-lk-1', product_id: '550e8400-e29b-41d4-a716-446655440019', image_url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1000&auto=format&fit=crop', alt_text: 'Longline Knit Dress', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440020',
    sku: 'HW-LT-020',
    slug: 'structured-leather-tote',
    name: 'Structured Leather Tote',
    description: 'Full-grain vegetable-tanned bovine leather tote featuring architectural raw-edge panels and interior laptop compartment.',
    category: 'ACCESSORIES',
    category_id: 'cat-accessories',
    collection_id: 'col-hardware',
    collection_name: 'Industrial Hardware & Leather',
    collection_slug: 'industrial-hardware',
    fit_type: 'BOXY',
    fabric_weight: '3.2 mm Saddle-Grade Bridle Leather',
    composition: '100% Vegetable-Tanned Calfskin, Brushed Stainless Hardware',
    country_of_origin: 'Made in Italy',
    care_instructions: 'Condition annually with neutral leather balm.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 48000,
    currency: 'USD',
    stock: 8,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-lt-1', product_id: '550e8400-e29b-41d4-a716-446655440020', sku: 'HW-LT-020-BLK-OS', size: 'ONE SIZE', color: 'Ink Black', color_hex: '#1B0E0D', stock: 8, is_active: true }
    ],
    images: [
      { id: 'img-lt-1', product_id: '550e8400-e29b-41d4-a716-446655440020', image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop', alt_text: 'Structured Leather Tote', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440021',
    sku: 'HW-CB-021',
    slug: 'technical-crossbody-bag',
    name: 'Technical Crossbody Bag',
    description: 'Compact modular sling with Fidlock V-buckle magnetic closure, weather-resistant zip compartments, and mil-spec webbing.',
    category: 'ACCESSORIES',
    category_id: 'cat-accessories',
    collection_id: 'col-hardware',
    collection_name: 'Industrial Hardware & Leather',
    collection_slug: 'industrial-hardware',
    fit_type: 'BOXY',
    fabric_weight: '1000D Cordura Ballistic Nylon',
    composition: '100% High-Tenacity Cordura, Anodized Aluminum Buckle',
    country_of_origin: 'Made in Japan',
    care_instructions: 'Spot clean with damp cloth.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 14000,
    currency: 'USD',
    stock: 18,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-cb-1', product_id: '550e8400-e29b-41d4-a716-446655440021', sku: 'HW-CB-021-BLK-OS', size: 'ONE SIZE', color: 'Ink Black', color_hex: '#1B0E0D', stock: 12, is_active: true },
      { id: 'v-cb-2', product_id: '550e8400-e29b-41d4-a716-446655440021', sku: 'HW-CB-021-OLV-OS', size: 'ONE SIZE', color: 'Olive Drab', color_hex: '#4A5340', stock: 6, is_active: true }
    ],
    images: [
      { id: 'img-cb-1', product_id: '550e8400-e29b-41d4-a716-446655440021', image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop', alt_text: 'Technical Crossbody Bag', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440022',
    sku: 'HW-IB-022',
    slug: 'industrial-buckle-belt',
    name: 'Industrial Buckle Belt',
    description: '38mm high-density jacquard webbing paired with a quick-release CNC-machined aerospace alloy buckle with laser-etched serial code.',
    category: 'ACCESSORIES',
    category_id: 'cat-accessories',
    collection_id: 'col-hardware',
    collection_name: 'Industrial Hardware & Leather',
    collection_slug: 'industrial-hardware',
    fit_type: 'TAILORED',
    fabric_weight: 'Heavy Duty Mil-Spec Jacquard Webbing',
    composition: '100% Polyamide Webbing, 7075 Anodized Aluminum Hardware',
    country_of_origin: 'Made in Austria',
    care_instructions: 'Wipe metal with dry microfibre cloth.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 11000,
    currency: 'USD',
    stock: 22,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-ib-1', product_id: '550e8400-e29b-41d4-a716-446655440022', sku: 'HW-IB-022-BLK-S', size: 'S', color: 'Ink Black', color_hex: '#1B0E0D', stock: 7, is_active: true },
      { id: 'v-ib-2', product_id: '550e8400-e29b-41d4-a716-446655440022', sku: 'HW-IB-022-BLK-M', size: 'M', color: 'Ink Black', color_hex: '#1B0E0D', stock: 8, is_active: true },
      { id: 'v-ib-3', product_id: '550e8400-e29b-41d4-a716-446655440022', sku: 'HW-IB-022-RED-L', size: 'L', color: 'Burnt Red', color_hex: '#C72A09', stock: 7, is_active: true }
    ],
    images: [
      { id: 'img-ib-1', product_id: '550e8400-e29b-41d4-a716-446655440022', image_url: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=1000&auto=format&fit=crop', alt_text: 'Industrial Buckle Belt', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440023',
    sku: 'HW-MS-023',
    slug: 'merino-wrap-scarf',
    name: 'Merino Wrap Scarf',
    description: 'Substantial 220cm architectural blanket scarf in ribbed virgin wool with clean selvedge border finish and woven label.',
    category: 'ACCESSORIES',
    category_id: 'cat-accessories',
    collection_id: 'col-core',
    collection_name: 'Core Minimalist',
    collection_slug: 'core-minimalist',
    fit_type: 'OVERSIZED',
    fabric_weight: '480 GSM Double-Rib Heavyweight Knit',
    composition: '100% Extra-Fine Virgin Merino Wool',
    country_of_origin: 'Made in Scotland',
    care_instructions: 'Dry clean or gentle hand wash cold.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 13000,
    currency: 'USD',
    stock: 16,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-ms-1', product_id: '550e8400-e29b-41d4-a716-446655440023', sku: 'HW-MS-023-GRY-OS', size: 'ONE SIZE', color: 'Ash Grey', color_hex: '#7D7D7D', stock: 8, is_active: true },
      { id: 'v-ms-2', product_id: '550e8400-e29b-41d4-a716-446655440023', sku: 'HW-MS-023-BLK-OS', size: 'ONE SIZE', color: 'Ink Black', color_hex: '#1B0E0D', stock: 8, is_active: true }
    ],
    images: [
      { id: 'img-ms-1', product_id: '550e8400-e29b-41d4-a716-446655440023', image_url: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=1000&auto=format&fit=crop', alt_text: 'Merino Wrap Scarf', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440024',
    sku: 'HW-FN-024',
    slug: 'season-04-archive-field-notes',
    name: 'Season 04 Archive Field Notes',
    description: 'Numbered edition archival monograph containing brutalist technical line drawings, typography specimens, and raw fabric swatches.',
    category: 'OBJECTS',
    category_id: 'cat-objects',
    collection_id: 'col-s04',
    collection_name: 'Season 04 // Brutalist Heavy',
    collection_slug: 'season-04-brutalist',
    fit_type: 'BOXY',
    fabric_weight: '300 GSM Uncoated Heavyweight Board',
    composition: 'FSC Certified Heavy Cotton Paper, Stainless Steel Screw Binding',
    country_of_origin: 'Made in Germany',
    care_instructions: 'Store in moisture-controlled archive environment.',
    rating_avg: undefined,
    rating_count: 0,
    price_cents: 4500,
    currency: 'USD',
    stock: 35,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-fn-1', product_id: '550e8400-e29b-41d4-a716-446655440024', sku: 'HW-FN-024-STD-OS', size: 'ONE SIZE', color: 'Concrete Bone', color_hex: '#E3E2DE', stock: 35, is_active: true }
    ],
    images: [
      { id: 'img-fn-1', product_id: '550e8400-e29b-41d4-a716-446655440024', image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop', alt_text: 'Season 04 Archive Field Notes', is_primary: true, sort_order: 1 }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const IN_MEMORY_ORDERS: Map<string, Order> = new Map();
export const IN_MEMORY_IDEMPOTENCY: Map<string, { hash: string; status: string; order: Order; responseCode: number }> = new Map();
export const IN_MEMORY_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'audit-init-1',
    actor_id: null,
    actor_username: 'system',
    action: 'SYSTEM_BOOTSTRAP_SEED',
    resource_type: 'SYSTEM',
    resource_id: 'INITIAL_SEED',
    before_state: null,
    after_state: { seededProductsCount: 6, seededCategoriesCount: 9, seededCollectionsCount: 3 },
    correlation_id: 'bootstrap-seed',
    created_at: new Date().toISOString()
  }
];

// Season 04 Customer In-Memory Storage
export interface InMemoryCustomerUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  is_verified: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InMemoryUserSession {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  user_agent?: string | null;
  ip_address?: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

export interface InMemoryVerificationToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface InMemoryPasswordResetToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface InMemoryCustomerPreferences {
  user_id: string;
  gender_presentation: string;
  favorite_categories: string[];
  preferred_styles: string[];
  preferred_fits: string[];
  preferred_sizes: string[];
  preferred_colors: string[];
  price_range_min_cents: number;
  price_range_max_cents: number;
  onboarding_completed: boolean;
  newsletter_subscribed: boolean;
  created_at: string;
  updated_at: string;
}

export interface InMemoryCustomerAddress {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  created_at: string;
  updated_at: string;
}

export const IN_MEMORY_USERS: Map<string, InMemoryCustomerUser> = new Map();
export const IN_MEMORY_USER_SESSIONS: Map<string, InMemoryUserSession> = new Map();
export const IN_MEMORY_VERIFICATION_TOKENS: Map<string, InMemoryVerificationToken> = new Map();
export const IN_MEMORY_PASSWORD_RESET_TOKENS: Map<string, InMemoryPasswordResetToken> = new Map();
export const IN_MEMORY_PREFERENCES: Map<string, InMemoryCustomerPreferences> = new Map();
export const IN_MEMORY_ADDRESSES: Map<string, InMemoryCustomerAddress> = new Map();
