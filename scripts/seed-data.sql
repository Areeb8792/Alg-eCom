-- Seed script for Algions AI Labs PostgreSQL Database

-- 1. Products
INSERT INTO products (id, sku, slug, name, description, category, price_cents, currency, stock, is_active, image_url)
VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'HW-PF-001', 'statement-puffer', 'Statement Puffer', 'Silk blend outer shell with technical down fill. Features brutalist minimalist lines and an oversized architectural collar.', 'OUTERWEAR', 14000, 'USD', 15, true, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop'),
('550e8400-e29b-41d4-a716-446655440002', 'HW-TE-002', 'minimalist-tee', 'Minimalist Tee', 'Heavyweight organic cotton jersey with hand-finished collar binding and dropped shoulder construction.', 'TOPS', 6500, 'USD', 30, true, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop'),
('550e8400-e29b-41d4-a716-446655440003', 'HW-BL-003', 'oversized-blazer', 'Oversized Blazer', 'Structured wool-blend silhouette with sharp shoulders, concealed double-breasted horn buttons and cupro lining.', 'TAILORING', 21000, 'USD', 10, true, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop'),
('550e8400-e29b-41d4-a716-446655440004', 'HW-TR-004', 'tailored-silhouette', 'Tailored Silhouette Trousers', 'High-waisted relaxed trouser cut from breathable organic linen weave with sharp front pleats.', 'TAILORING', 18000, 'USD', 18, true, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop'),
('550e8400-e29b-41d4-a716-446655440005', 'HW-AC-005', 'silk-blend-scarf', 'Silk Blend Monogram Scarf', 'Raw-edged lightweight cashmere silk jacquard with subtle typographic motif.', 'ACCESSORIES', 8500, 'USD', 22, true, 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=1000&auto=format&fit=crop'),
('550e8400-e29b-41d4-a716-446655440006', 'HW-FC-006', 'technical-field-coat', 'Technical Field Coat', 'Water-repellent matte nylon shell with modular magnetic utility pockets and storm flap.', 'OUTERWEAR', 32000, 'USD', 6, true, 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop')
ON CONFLICT (sku) DO NOTHING;

-- 2. Admin Users
INSERT INTO admin_users (id, username, password_hash, role)
VALUES 
('a0000000-0000-0000-0000-000000000001', 'admin@algions.com', '$2a$10$w4rUe8gTf4V9g6xO3.4i7.e2D3e5L0t4H6y1S0v7B8N9M0K1L2O3P', 'ADMIN')
ON CONFLICT (username) DO NOTHING;

-- 3. Orders
INSERT INTO orders (id, order_reference, customer_email, customer_name, status, subtotal_cents, currency)
VALUES
('b0000000-0000-0000-0000-000000000001', 'HW-2026-0001', 'vip.client@luxuryfashion.com', 'Areeb Ali', 'CONFIRMED', 20500, 'USD'),
('b0000000-0000-0000-0000-000000000002', 'HW-2026-0002', 'buyer@algions.internal', 'Elena Rostova', 'CONFIRMED', 14000, 'USD')
ON CONFLICT (order_reference) DO NOTHING;

-- 4. Order Items
INSERT INTO order_items (id, order_id, product_id, quantity, product_name_snapshot, sku_snapshot, unit_price_cents_snapshot, currency_snapshot)
VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', 1, 'Statement Puffer', 'HW-PF-001', 14000, 'USD'),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440002', 1, 'Minimalist Tee', 'HW-TE-002', 6500, 'USD'),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440001', 1, 'Statement Puffer', 'HW-PF-001', 14000, 'USD')
ON CONFLICT (id) DO NOTHING;

-- 5. Audit Events
INSERT INTO audit_events (id, actor_id, actor_username, action, resource_type, resource_id, before_state, after_state, correlation_id)
VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'admin@algions.com', 'ORDER_CREATED', 'ORDER', 'b0000000-0000-0000-0000-000000000001', NULL, '{"order_reference":"HW-2026-0001","total":20500}', 'corr-audit-001'),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'admin@algions.com', 'INVENTORY_ALLOCATED', 'PRODUCT', '550e8400-e29b-41d4-a716-446655440001', '{"stock":16}', '{"stock":15}', 'corr-audit-002')
ON CONFLICT (id) DO NOTHING;

-- 6. Idempotency Keys
INSERT INTO idempotency_keys (key, request_hash, status, order_id, response_code, response_body)
VALUES
('idemp-key-order-001', 'sha256-req-hash-001', 'COMPLETED', 'b0000000-0000-0000-0000-000000000001', 201, '{"status":"confirmed","orderReference":"HW-2026-0001"}'),
('idemp-key-order-002', 'sha256-req-hash-002', 'COMPLETED', 'b0000000-0000-0000-0000-000000000002', 201, '{"status":"confirmed","orderReference":"HW-2026-0002"}')
ON CONFLICT (key) DO NOTHING;
