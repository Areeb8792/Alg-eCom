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
