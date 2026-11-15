export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  currency: string;
  stock: number;
  is_active: boolean;
  image_url: string;
  created_at: string;
  updated_at: string;
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

