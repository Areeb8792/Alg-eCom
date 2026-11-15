import {
  Product,
  Category,
  Collection,
  ProductFilterParams,
  Order,
  AuditEvent,
  HealthCheckResponse,
  CustomerUser,
  CustomerPreferences,
  CustomerAddress,
  CustomerAuthResponse
} from '../types/index.js';

const API_BASE = '/api/v1';

// CSRF double-submit token retrieval from client cookie
export function getCsrfTokenFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^|;\\s*)algions_csrf_token=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

// Customer Identity & Onboarding APIs (Season 04)
export async function registerCustomer(data: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}): Promise<CustomerAuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Registration failed');
  }
  return json.data;
}

export async function loginCustomer(data: {
  email: string;
  password: string;
}): Promise<CustomerAuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Authentication failed');
  }
  return json.data;
}

export async function refreshCustomerSession(): Promise<CustomerAuthResponse> {
  const csrf = getCsrfTokenFromCookie();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (csrf) {
    headers['x-csrf-token'] = csrf;
  }

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify({})
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Session refresh failed');
  }
  return json.data;
}

export async function logoutCustomer(token?: string, refreshToken?: string): Promise<void> {
  if (!token) return;
  const csrf = getCsrfTokenFromCookie();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
  if (csrf) {
    headers['x-csrf-token'] = csrf;
  }

  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify({ refreshToken })
  }).catch(() => {});
}

export async function verifyCustomerEmail(token: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Email verification failed');
  }
  return json.data;
}

export async function resendCustomerVerification(email: string): Promise<{ success: boolean; message: string; verificationToken?: string }> {
  const res = await fetch(`${API_BASE}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to resend verification');
  }
  return json.data;
}

export async function forgotCustomerPassword(email: string): Promise<{ success: boolean; message: string; resetToken?: string }> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Password reset request failed');
  }
  return json.data;
}

export async function resetCustomerPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password })
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Password reset failed');
  }
  return json.data;
}

export async function fetchCustomerProfile(token: string): Promise<CustomerUser> {
  const res = await fetch(`${API_BASE}/user/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to fetch customer profile');
  }
  return json.data;
}

export async function updateCustomerProfile(token: string, data: { full_name?: string; phone?: string | null }): Promise<CustomerUser> {
  const res = await fetch(`${API_BASE}/user/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to update profile');
  }
  return json.data;
}

export async function fetchCustomerPreferences(token: string): Promise<CustomerPreferences> {
  const res = await fetch(`${API_BASE}/user/preferences`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to fetch preferences');
  }
  return json.data;
}

export async function updateCustomerPreferences(token: string, data: Partial<CustomerPreferences>): Promise<CustomerPreferences> {
  const res = await fetch(`${API_BASE}/user/preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to update preferences');
  }
  return json.data;
}

export async function fetchCustomerAddresses(token: string): Promise<CustomerAddress[]> {
  const res = await fetch(`${API_BASE}/user/addresses`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to fetch addresses');
  }
  return json.data;
}

export async function createCustomerAddress(token: string, data: Omit<CustomerAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<CustomerAddress> {
  const res = await fetch(`${API_BASE}/user/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to save address');
  }
  return json.data;
}

export async function updateCustomerAddress(token: string, addressId: string, data: Partial<CustomerAddress>): Promise<CustomerAddress> {
  const res = await fetch(`${API_BASE}/user/addresses/${addressId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to update address');
  }
  return json.data;
}

export async function deleteCustomerAddress(token: string, addressId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/user/addresses/${addressId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to delete address');
  }
}


export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error(`Failed to load categories: ${res.statusText}`);
  const json = await res.json();
  return json.data;
}

export async function fetchCollections(): Promise<Collection[]> {
  const res = await fetch(`${API_BASE}/collections`);
  if (!res.ok) throw new Error(`Failed to load collections: ${res.statusText}`);
  const json = await res.json();
  return json.data;
}

export async function fetchRecommendations(token?: string): Promise<Product[]> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}/recommendations`, { headers });
  if (!res.ok) throw new Error(`Failed to load recommendations: ${res.statusText}`);
  const json = await res.json();
  return json.data;
}

export async function fetchProducts(
  filterOrCategory?: string | ProductFilterParams,
  search?: string
): Promise<{ products: Product[]; total: number; totalPages?: number }> {
  const params = new URLSearchParams();

  if (typeof filterOrCategory === 'object' && filterOrCategory !== null) {
    const filters = filterOrCategory;
    if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);
    if (filters.collection) params.append('collection', filters.collection);
    if (filters.size) params.append('size', filters.size);
    if (filters.color) params.append('color', filters.color);
    if (filters.fit) params.append('fit', filters.fit);
    if (filters.minPrice !== undefined) params.append('minPrice', String(filters.minPrice));
    if (filters.maxPrice !== undefined) params.append('maxPrice', String(filters.maxPrice));
    if (filters.inStockOnly) params.append('inStockOnly', 'true');
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
  } else {
    if (filterOrCategory && filterOrCategory !== 'ALL') params.append('category', filterOrCategory);
    if (search) params.append('search', search);
  }

  const queryStr = params.toString();
  const url = queryStr ? `${API_BASE}/products?${queryStr}` : `${API_BASE}/products`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load products: ${res.statusText}`);
  const json = await res.json();
  return {
    products: json.data,
    total: json.pagination?.total || json.data.length,
    totalPages: json.pagination?.totalPages || 1
  };
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (!res.ok) throw new Error(`Product not found: ${res.statusText}`);
  const json = await res.json();
  return json.data;
}

export async function createOrder(
  data: { customerEmail: string; customerName: string; items: { productId: string; quantity: number }[] },
  idempotencyKey: string
): Promise<{ order: Order; isReplayed: boolean }> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify(data)
  });

  const isReplayed = res.headers.get('x-idempotent-replayed') === 'true';
  const json = await res.json();

  if (!res.ok) {
    const errorMsg = json.error?.message || `Checkout failed (${res.status})`;
    const error = new Error(errorMsg);
    (error as any).code = json.error?.code;
    throw error;
  }

  return { order: json.data.order, isReplayed };
}

export async function fetchOrder(id: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}`);
  if (!res.ok) throw new Error(`Order not found (${res.status})`);
  const json = await res.json();
  return json.data;
}

export async function adminLogin(username: string, password: string): Promise<{ token: string; user: { id: string; username: string } }> {
  const res = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Admin authentication failed');
  }

  return json.data;
}

export async function updateProduct(id: string, updates: Partial<Product>, token: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/admin/products/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to update product');
  }

  return json.data;
}

export async function adjustStock(id: string, adjustment: number, reason: string, token: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/admin/products/${id}/stock-adjustments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ adjustment, reason })
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to adjust stock');
  }

  return json.data;
}

export async function fetchAuditEvents(token: string): Promise<AuditEvent[]> {
  const res = await fetch(`${API_BASE}/admin/audit-events?limit=25`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to fetch audit events');
  }

  return json.data;
}

export async function checkHealthLive(): Promise<HealthCheckResponse> {
  const res = await fetch(`${API_BASE}/health/live`);
  return await res.json();
}

export async function checkHealthReady(): Promise<HealthCheckResponse> {
  const res = await fetch(`${API_BASE}/health/ready`);
  return await res.json();
}
