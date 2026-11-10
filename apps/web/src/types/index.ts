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
