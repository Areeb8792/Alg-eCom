import bcrypt from 'bcryptjs';
import { Product } from '../repositories/productRepository.js';
import { Order, OrderItem } from '../repositories/orderRepository.js';
import { AuditEvent } from '../repositories/adminRepository.js';

export const IN_MEMORY_PRODUCTS: Product[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    sku: 'HW-PF-001',
    slug: 'statement-puffer',
    name: 'Statement Puffer',
    description: 'Silk blend outer shell with technical down fill. Features brutalist minimalist lines and an oversized architectural collar.',
    category: 'OUTERWEAR',
    price_cents: 14000,
    currency: 'USD',
    stock: 15,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    sku: 'HW-TE-002',
    slug: 'minimalist-tee',
    name: 'Minimalist Tee',
    description: 'Heavyweight organic cotton jersey with hand-finished collar binding and dropped shoulder construction.',
    category: 'TOPS',
    price_cents: 6500,
    currency: 'USD',
    stock: 30,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    sku: 'HW-BL-003',
    slug: 'oversized-blazer',
    name: 'Oversized Blazer',
    description: 'Structured wool-blend silhouette with sharp shoulders, concealed double-breasted horn buttons and cupro lining.',
    category: 'TAILORING',
    price_cents: 21000,
    currency: 'USD',
    stock: 10,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    sku: 'HW-TR-004',
    slug: 'tailored-silhouette',
    name: 'Tailored Silhouette Trousers',
    description: 'High-waisted relaxed trouser cut from breathable organic linen weave with sharp front pleats.',
    category: 'TAILORING',
    price_cents: 18000,
    currency: 'USD',
    stock: 18,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    sku: 'HW-AC-005',
    slug: 'silk-blend-scarf',
    name: 'Silk Blend Monogram Scarf',
    description: 'Raw-edged lightweight cashmere silk jacquard with subtle typographic motif.',
    category: 'ACCESSORIES',
    price_cents: 8500,
    currency: 'USD',
    stock: 22,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=1000&auto=format&fit=crop',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    sku: 'HW-FC-006',
    slug: 'technical-field-coat',
    name: 'Technical Field Coat',
    description: 'Water-repellent matte nylon shell with modular magnetic utility pockets and storm flap.',
    category: 'OUTERWEAR',
    price_cents: 32000,
    currency: 'USD',
    stock: 6,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop',
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
    after_state: { seededProductsCount: 6 },
    correlation_id: 'bootstrap-seed',
    created_at: new Date().toISOString()
  }
];
