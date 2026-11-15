-- Algions AI Labs — Database Schema
-- Service: Product and Order API

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(64) NOT NULL UNIQUE,
    slug VARCHAR(128) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    stock INTEGER NOT NULL CHECK (stock >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_reference VARCHAR(64) NOT NULL UNIQUE,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED',
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: order_items (stores immutable snapshots of product at purchase time)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    product_name_snapshot VARCHAR(255) NOT NULL,
    sku_snapshot VARCHAR(64) NOT NULL,
    unit_price_cents_snapshot INTEGER NOT NULL CHECK (unit_price_cents_snapshot >= 0),
    currency_snapshot VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: idempotency_keys (handles exact retry vs conflict safely)
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    request_hash VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    response_code INTEGER,
    response_body JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: admin_users
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'ADMIN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: audit_events (tracks all admin updates and stock adjustments)
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    actor_username VARCHAR(128) NOT NULL,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(128) NOT NULL,
    before_state JSONB,
    after_state JSONB,
    correlation_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at DESC);

-- Immutability enforcement on audit_events (Append-only security guarantee)
CREATE OR REPLACE FUNCTION prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Security Policy Violation: Audit records are strictly append-only and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_events_immutable ON audit_events;
CREATE TRIGGER trg_audit_events_immutable
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();

-- ==============================================================================
-- Season 04 — Customer Identity, Preferences, and Address Architecture
-- ==============================================================================

-- Table: users (Customer accounts)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: user_sessions (Refresh tokens & session revocation)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
    user_agent TEXT,
    ip_address VARCHAR(64),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: email_verification_tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: password_reset_tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: customer_preferences (Season 04 Editorial & Fit Dimensions)
CREATE TABLE IF NOT EXISTS customer_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    gender_presentation VARCHAR(32) DEFAULT 'ALL',
    favorite_categories TEXT[] DEFAULT '{}',
    preferred_styles TEXT[] DEFAULT '{}',
    preferred_fits TEXT[] DEFAULT '{}',
    preferred_sizes TEXT[] DEFAULT '{}',
    preferred_colors TEXT[] DEFAULT '{}',
    price_range_min_cents INTEGER DEFAULT 0,
    price_range_max_cents INTEGER DEFAULT 500000,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    newsletter_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: customer_addresses (Address Book)
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(64) NOT NULL DEFAULT 'Home',
    recipient_name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(128) NOT NULL,
    state_province VARCHAR(128) NOT NULL,
    postal_code VARCHAR(32) NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'US',
    is_default_shipping BOOLEAN NOT NULL DEFAULT FALSE,
    is_default_billing BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON customer_addresses(user_id);

-- ==============================================================================
-- Season 04 — Product Catalogue, Variants, Collections & Editorial Imagery
-- ==============================================================================

-- Table: categories (Hierarchical)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    slug VARCHAR(128) NOT NULL UNIQUE,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: collections (Editorial curations)
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    slug VARCHAR(128) NOT NULL UNIQUE,
    tagline VARCHAR(255),
    description TEXT,
    editorial_banner_url TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alter products to add editorial attributes if not present
ALTER TABLE products ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS fit_type VARCHAR(32) DEFAULT 'RELAXED';
ALTER TABLE products ADD COLUMN IF NOT EXISTS fabric_weight VARCHAR(64);
ALTER TABLE products ADD COLUMN IF NOT EXISTS composition TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS country_of_origin VARCHAR(64);
ALTER TABLE products ADD COLUMN IF NOT EXISTS care_instructions TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) DEFAULT 5.0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Table: product_variants (SKU, size, color, stock, price override)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(64) NOT NULL UNIQUE,
    size VARCHAR(32) NOT NULL,
    color VARCHAR(64) NOT NULL,
    color_hex VARCHAR(16) NOT NULL DEFAULT '#1B0E0D',
    price_cents INTEGER,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: product_images (Multi-image editorial gallery)
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- Season 04 — Shopping Bag, Wishlist & Promotions Architecture
-- ==============================================================================

-- Table: carts (Supports guest sessions and authenticated users)
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(128) UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: cart_items
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cart_variant UNIQUE (cart_id, product_id, variant_id)
);

-- Table: wishlists
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(128) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: wishlist_items
CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_wishlist_product_variant UNIQUE (wishlist_id, product_id, variant_id)
);

-- Table: coupons
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,
    discount_type VARCHAR(32) NOT NULL DEFAULT 'PERCENTAGE',
    discount_value INTEGER NOT NULL CHECK (discount_value > 0),
    min_order_amount_cents INTEGER DEFAULT 0,
    max_discount_amount_cents INTEGER,
    usage_limit INTEGER,
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: coupon_redemptions
CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    discount_applied_cents INTEGER NOT NULL CHECK (discount_applied_cents >= 0),
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- Season 04 — India-First Payments, Orders Expansion & Fulfillment Lifecycle
-- ==============================================================================

-- Expand orders table with India-first & fulfillment columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee_cents INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_cents INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_cents INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_cents INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(32) DEFAULT 'UNFULFILLED';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Table: payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL DEFAULT 'SANDBOX',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    transaction_reference VARCHAR(128) UNIQUE,
    provider_payment_id VARCHAR(128),
    signature VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: shipments
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    carrier VARCHAR(64) NOT NULL DEFAULT 'BLUEDART_EXPRESS',
    tracking_number VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'MANIFESTED',
    shipped_at TIMESTAMPTZ,
    estimated_delivery TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: shipment_events
CREATE TABLE IF NOT EXISTS shipment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL,
    location VARCHAR(128),
    description TEXT NOT NULL,
    event_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: returns (Item-level post-purchase returns)
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    return_reference VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'REQUESTED',
    reason VARCHAR(128) NOT NULL,
    items JSONB NOT NULL,
    refund_amount_cents INTEGER NOT NULL CHECK (refund_amount_cents >= 0),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: refunds
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID REFERENCES returns(id) ON DELETE SET NULL,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    provider_refund_id VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: reviews (Verified purchase reviews)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(128),
    comment TEXT NOT NULL,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    helpful_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: notifications (Customer activity & order notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(128) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON returns(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

