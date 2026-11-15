export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string;
  color: string;
  color_hex: string;
  price_cents?: number | null;
  stock: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id?: string | null;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  children?: Category[];
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  editorial_banner_url?: string;
  is_featured: boolean;
  sort_order: number;
  product_count?: number;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  category_id?: string | null;
  collection_id?: string | null;
  collection_name?: string | null;
  collection_slug?: string | null;
  fit_type?: string;
  fabric_weight?: string;
  composition?: string;
  country_of_origin?: string;
  care_instructions?: string;
  rating_avg?: number;
  rating_count?: number;
  price_cents: number;
  currency: string;
  stock: number;
  is_active: boolean;
  image_url: string;
  variants?: ProductVariant[];
  images?: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface ProductFilterParams {
  category?: string;
  collection?: string;
  size?: string;
  color?: string;
  fit?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  search?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popularity' | 'rating';
  page?: number;
  limit?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price_cents_snapshot: number;
  currency_snapshot: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_reference: string;
  customer_email: string;
  customer_name: string;
  status: string;
  subtotal_cents: number;
  currency: string;
  items?: OrderItem[];
  is_privacy_masked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  id: string;
  actor_id: string | null;
  actor_username: string;
  action: string;
  resource_type: string;
  resource_id: string;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  correlation_id: string | null;
  created_at: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  service: string;
  checks?: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTimeMs?: number;
      error?: string;
    };
  };
}

// Season 04 Customer Identity & Preferences
export interface CustomerUser {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface CustomerPreferences {
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
  created_at?: string;
  updated_at?: string;
}

export interface CustomerAddress {
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
  created_at?: string;
  updated_at?: string;
}

export interface CustomerAuthResponse {
  user: CustomerUser;
  preferences: CustomerPreferences | null;
  token: string;
  refreshToken: string;
  verificationToken?: string;
}

