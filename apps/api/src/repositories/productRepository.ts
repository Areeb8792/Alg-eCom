import { PoolClient } from 'pg';
import { query } from '../database/connection.js';
import {
  IN_MEMORY_PRODUCTS,
  IN_MEMORY_CATEGORIES,
  IN_MEMORY_COLLECTIONS
} from '../database/inMemoryStore.js';
import { config } from '../config/index.js';

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

export interface ProductQueryParams {
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
  offset: number;
  limit: number;
}

export class ProductRepository {
  private static isDbAvailable: boolean | null = null;

  private shouldUseMemoryFallback(err?: any): boolean {
    const isAllowed =
      process.env.ALLOW_IN_MEMORY_FALLBACK === 'true' ||
      (config.NODE_ENV === 'development' && (err?.code === 'ECONNREFUSED' || err?.code === 'ENOTFOUND'));
    if (!isAllowed) return false;
    if (err && (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT')) {
      ProductRepository.isDbAvailable = false;
    }
    return true;
  }

  private isDbDirectFallback(): boolean {
    return (
      (process.env.ALLOW_IN_MEMORY_FALLBACK === 'true' || config.NODE_ENV === 'development') &&
      ProductRepository.isDbAvailable === false
    );
  }

  async findAll(params: ProductQueryParams): Promise<{ products: Product[]; total: number }> {
    if (this.isDbDirectFallback()) {
      return this.findAllInMemory(params);
    }
    try {
      const conditions: string[] = ['p.is_active = TRUE'];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (params.category && params.category !== 'ALL') {
        conditions.push(`(p.category ILIKE $${paramIndex} OR cat.slug ILIKE $${paramIndex} OR cat.name ILIKE $${paramIndex})`);
        values.push(`%${params.category}%`);
        paramIndex++;
      }

      if (params.collection) {
        conditions.push(`(c.slug = $${paramIndex} OR c.name ILIKE $${paramIndex})`);
        values.push(params.collection);
        paramIndex++;
      }

      if (params.size) {
        conditions.push(`EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.size ILIKE $${paramIndex} AND pv.is_active = TRUE)`);
        values.push(params.size);
        paramIndex++;
      }

      if (params.color) {
        conditions.push(`EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.color ILIKE $${paramIndex} AND pv.is_active = TRUE)`);
        values.push(`%${params.color}%`);
        paramIndex++;
      }

      if (params.fit) {
        conditions.push(`p.fit_type ILIKE $${paramIndex}`);
        values.push(params.fit);
        paramIndex++;
      }

      if (params.minPrice !== undefined) {
        conditions.push(`p.price_cents >= $${paramIndex++}`);
        values.push(params.minPrice);
      }

      if (params.maxPrice !== undefined) {
        conditions.push(`p.price_cents <= $${paramIndex++}`);
        values.push(params.maxPrice);
      }

      if (params.inStockOnly) {
        conditions.push(`p.stock > 0`);
      }

      if (params.search) {
        conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex} OR p.category ILIKE $${paramIndex})`);
        values.push(`%${params.search}%`);
        paramIndex++;
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count query
      const countSql = `
        SELECT COUNT(DISTINCT p.id) AS total
        FROM products p
        LEFT JOIN collections c ON p.collection_id = c.id
        LEFT JOIN categories cat ON p.category_id = cat.id
        ${whereClause};
      `;
      const countRes = await query<{ total: string }>(countSql, values);
      const total = parseInt(countRes.rows[0].total, 10);

      // Sorting
      let orderBy = 'p.created_at DESC';
      if (params.sort === 'price_asc') orderBy = 'p.price_cents ASC, p.created_at DESC';
      else if (params.sort === 'price_desc') orderBy = 'p.price_cents DESC, p.created_at DESC';
      else if (params.sort === 'popularity') orderBy = 'p.rating_count DESC, p.stock DESC';
      else if (params.sort === 'rating') orderBy = 'p.rating_avg DESC NULLS LAST, p.created_at DESC';

      const listSql = `
        SELECT p.id, p.sku, p.slug, p.name, p.description, p.category, p.category_id,
               p.collection_id, p.fit_type, p.fabric_weight, p.composition, p.country_of_origin,
               p.care_instructions, p.rating_avg, p.rating_count, p.price_cents, p.currency,
               p.stock, p.is_active, p.image_url, p.created_at, p.updated_at,
               c.name AS collection_name, c.slug AS collection_slug
        FROM products p
        LEFT JOIN collections c ON p.collection_id = c.id
        LEFT JOIN categories cat ON p.category_id = cat.id
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++};
      `;

      const listRes = await query<Product>(listSql, [...values, params.limit, params.offset]);
      if (!listRes.rows.length && (params.size || params.color || params.collection)) {
        const mem = this.findAllInMemory(params);
        if (mem.products.length) return mem;
      }
      const products = await this.populateVariantsAndImagesForList(listRes.rows);

      ProductRepository.isDbAvailable = true;
      return { products, total };
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        return this.findAllInMemory(params);
      }
      throw err;
    }
  }

  private async populateVariantsAndImagesForList(products: Product[]): Promise<Product[]> {
    if (!products.length) return products;
    try {
      const productIds = products.map((p) => p.id);
      const variantsRes = await query<ProductVariant>(
        `SELECT id, product_id, sku, size, color, color_hex, price_cents, stock, is_active
         FROM product_variants
         WHERE product_id = ANY($1) AND is_active = TRUE
         ORDER BY sku ASC;`,
        [productIds]
      );
      const imagesRes = await query<ProductImage>(
        `SELECT id, product_id, variant_id, image_url, alt_text, is_primary, sort_order
         FROM product_images
         WHERE product_id = ANY($1)
         ORDER BY sort_order ASC;`,
        [productIds]
      );

      const variantsMap = new Map<string, ProductVariant[]>();
      for (const v of variantsRes.rows) {
        const arr = variantsMap.get(v.product_id) || [];
        arr.push(v);
        variantsMap.set(v.product_id, arr);
      }

      const imagesMap = new Map<string, ProductImage[]>();
      for (const img of imagesRes.rows) {
        const arr = imagesMap.get(img.product_id) || [];
        arr.push(img);
        imagesMap.set(img.product_id, arr);
      }

      return products.map((p) => ({
        ...p,
        variants: variantsMap.get(p.id) || p.variants || [],
        images: imagesMap.get(p.id) || p.images || (p.image_url ? [{ id: `img-${p.id}`, product_id: p.id, image_url: p.image_url, is_primary: true, sort_order: 1 }] : [])
      }));
    } catch {
      return products;
    }
  }

  private findAllInMemory(params: ProductQueryParams): { products: Product[]; total: number } {
    let filtered = IN_MEMORY_PRODUCTS.filter((p) => p.is_active);

    if (params.category && params.category !== 'ALL') {
      const catUpper = params.category.toUpperCase();
      filtered = filtered.filter(
        (p) => p.category.toUpperCase() === catUpper || (p.category_id && p.category_id.toUpperCase().includes(catUpper))
      );
    }

    if (params.collection) {
      filtered = filtered.filter(
        (p) => p.collection_slug === params.collection || p.collection_id === params.collection
      );
    }

    if (params.size) {
      filtered = filtered.filter((p) =>
        p.variants?.some((v) => v.size.toUpperCase() === params.size?.toUpperCase() && v.is_active)
      );
    }

    if (params.color) {
      filtered = filtered.filter((p) =>
        p.variants?.some((v) => v.color.toLowerCase().includes(params.color!.toLowerCase()) && v.is_active)
      );
    }

    if (params.fit) {
      filtered = filtered.filter((p) => p.fit_type?.toUpperCase() === params.fit?.toUpperCase());
    }

    if (params.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price_cents >= params.minPrice!);
    }

    if (params.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price_cents <= params.maxPrice!);
    }

    if (params.inStockOnly) {
      filtered = filtered.filter((p) => p.stock > 0);
    }

    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.description.toLowerCase().includes(s) ||
          p.sku.toLowerCase().includes(s) ||
          p.category.toLowerCase().includes(s)
      );
    }

    // Sort
    if (params.sort === 'price_asc') {
      filtered.sort((a, b) => a.price_cents - b.price_cents);
    } else if (params.sort === 'price_desc') {
      filtered.sort((a, b) => b.price_cents - a.price_cents);
    } else if (params.sort === 'popularity') {
      filtered.sort((a, b) => (b.rating_count || 0) - (a.rating_count || 0));
    } else if (params.sort === 'rating') {
      filtered.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
    } else {
      // newest
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const total = filtered.length;
    const page = filtered.slice(params.offset, params.offset + params.limit);
    return { products: page, total };
  }

  async findById(idOrSlug: string, client?: PoolClient): Promise<Product | null> {
    if (this.isDbDirectFallback()) {
      return this.findByIdInMemory(idOrSlug);
    }
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      const sql = `
        SELECT p.id, p.sku, p.slug, p.name, p.description, p.category, p.category_id,
               p.collection_id, p.fit_type, p.fabric_weight, p.composition, p.country_of_origin,
               p.care_instructions, p.rating_avg, p.rating_count, p.price_cents, p.currency,
               p.stock, p.is_active, p.image_url, p.created_at, p.updated_at,
               c.name AS collection_name, c.slug AS collection_slug
        FROM products p
        LEFT JOIN collections c ON p.collection_id = c.id
        WHERE ${isUUID ? 'p.id = $1' : 'p.slug = $1'}
        LIMIT 1;
      `;
      const res = client ? await client.query<Product>(sql, [idOrSlug]) : await query<Product>(sql, [idOrSlug]);
      const product = res.rows[0];
      if (!product) return null;

      // Attach variants and images if not in a transactional client context
      if (!client) {
        const populated = await this.populateVariantsAndImagesForList([product]);
        const p = populated[0] || product;
        if (!p.variants?.length) {
          const mem = this.findByIdInMemory(idOrSlug);
          if (mem?.variants?.length) {
            p.variants = mem.variants;
            p.images = mem.images || p.images;
          }
        }
        return p;
      }
      return product;
    } catch (err: any) {
      if (this.shouldUseMemoryFallback(err)) {
        return this.findByIdInMemory(idOrSlug);
      }
      throw err;
    }
  }

  private findByIdInMemory(idOrSlug: string): Product | null {
    const found = IN_MEMORY_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    return found || null;
  }

  async getCategories(): Promise<Category[]> {
    if (this.isDbDirectFallback()) {
      return this.getCategoriesTreeInMemory();
    }
    try {
      const sql = `SELECT id, name, slug, parent_id, description, image_url, sort_order, is_active FROM categories WHERE is_active = TRUE ORDER BY sort_order ASC;`;
      const res = await query<Category>(sql);
      if (!res.rows.length) {
        return this.getCategoriesTreeInMemory();
      }
      return this.buildCategoryTree(res.rows);
    } catch (err) {
      if (this.shouldUseMemoryFallback(err)) {
        return this.getCategoriesTreeInMemory();
      }
      throw err;
    }
  }

  private buildCategoryTree(flat: Category[]): Category[] {
    const tree: Category[] = [];
    const map = new Map<string, Category>();

    for (const c of flat) {
      map.set(c.id, { ...c, children: [] });
    }

    for (const c of flat) {
      const node = map.get(c.id)!;
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.children!.push(node);
      } else {
        tree.push(node);
      }
    }

    return tree;
  }

  private getCategoriesTreeInMemory(): Category[] {
    return this.buildCategoryTree(IN_MEMORY_CATEGORIES);
  }

  async getCollections(): Promise<Collection[]> {
    if (this.isDbDirectFallback()) {
      return IN_MEMORY_COLLECTIONS;
    }
    try {
      const sql = `
        SELECT c.id, c.name, c.slug, c.tagline, c.description, c.editorial_banner_url, c.is_featured, c.sort_order,
               COUNT(p.id) AS product_count
        FROM collections c
        LEFT JOIN products p ON c.id = p.collection_id AND p.is_active = TRUE
        GROUP BY c.id
        ORDER BY c.sort_order ASC;
      `;
      const res = await query<Collection>(sql);
      if (!res.rows.length) {
        return IN_MEMORY_COLLECTIONS;
      }
      return res.rows.map((row) => ({
        ...row,
        product_count: parseInt(String(row.product_count || 0), 10)
      }));
    } catch (err) {
      if (this.shouldUseMemoryFallback(err)) {
        return IN_MEMORY_COLLECTIONS;
      }
      throw err;
    }
  }

  async getRecommendations(prefs?: {
    favorite_categories?: string[];
    preferred_styles?: string[];
    preferred_fits?: string[];
    preferred_sizes?: string[];
    preferred_colors?: string[];
    price_range_min_cents?: number;
    price_range_max_cents?: number;
  }): Promise<Product[]> {
    const all = await this.findAll({ limit: 20, offset: 0 });
    if (!prefs || (!prefs.favorite_categories?.length && !prefs.preferred_styles?.length && !prefs.preferred_sizes?.length)) {
      // Fallback: return featured products / highest rated
      return all.products.slice(0, 4);
    }

    const scored = all.products.map((p) => {
      let score = 0;
      if (prefs.favorite_categories?.some((c) => p.category.toUpperCase().includes(c.toUpperCase()))) {
        score += 3;
      }
      if (prefs.preferred_fits?.some((f) => p.fit_type?.toUpperCase() === f.toUpperCase())) {
        score += 2;
      }
      if (prefs.preferred_sizes?.length && p.variants?.some((v) => prefs.preferred_sizes!.includes(v.size))) {
        score += 2;
      }
      if (prefs.preferred_colors?.length && p.variants?.some((v) => prefs.preferred_colors!.some((col) => v.color.toLowerCase().includes(col.toLowerCase())))) {
        score += 2;
      }
      if (prefs.price_range_min_cents !== undefined && p.price_cents >= prefs.price_range_min_cents) {
        score += 1;
      }
      if (prefs.price_range_max_cents !== undefined && p.price_cents <= prefs.price_range_max_cents) {
        score += 1;
      }
      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const recommended = scored.filter((s) => s.score > 0).map((s) => s.product);

    return recommended.length ? recommended.slice(0, 4) : all.products.slice(0, 4);
  }

  async deductStockAtomic(
    client: PoolClient,
    productId: string,
    quantity: number
  ): Promise<Product | null> {
    try {
      const sql = `
        UPDATE products
        SET stock = stock - $1,
            updated_at = NOW()
        WHERE id = $2
          AND stock >= $1
          AND is_active = TRUE
        RETURNING id, sku, slug, name, description, category, price_cents, currency, stock, is_active, image_url, created_at, updated_at;
      `;
      const res = await client.query<Product>(sql, [quantity, productId]);
      return res.rows[0] || null;
    } catch (err) {
      if (this.shouldUseMemoryFallback(err)) {
        const p = IN_MEMORY_PRODUCTS.find((item) => item.id === productId);
        if (p && p.stock >= quantity && p.is_active) {
          p.stock -= quantity;
          p.updated_at = new Date().toISOString();
          return p;
        }
        return null;
      }
      throw err;
    }
  }

  async updateProduct(id: string, updates: Partial<Product>, client?: PoolClient): Promise<Product | null> {
    try {
      const setClauses: string[] = ['updated_at = NOW()'];
      const values: unknown[] = [id];
      let idx = 2;

      if (updates.name !== undefined) {
        setClauses.push(`name = $${idx++}`);
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        setClauses.push(`description = $${idx++}`);
        values.push(updates.description);
      }
      if (updates.category !== undefined) {
        setClauses.push(`category = $${idx++}`);
        values.push(updates.category.toUpperCase());
      }
      if (updates.price_cents !== undefined) {
        setClauses.push(`price_cents = $${idx++}`);
        values.push(updates.price_cents);
      }
      if (updates.stock !== undefined) {
        setClauses.push(`stock = $${idx++}`);
        values.push(updates.stock);
      }
      if (updates.is_active !== undefined) {
        setClauses.push(`is_active = $${idx++}`);
        values.push(updates.is_active);
      }
      if (updates.image_url !== undefined) {
        setClauses.push(`image_url = $${idx++}`);
        values.push(updates.image_url);
      }

      const sql = `
        UPDATE products
        SET ${setClauses.join(', ')}
        WHERE id = $1
        RETURNING id, sku, slug, name, description, category, price_cents, currency, stock, is_active, image_url, created_at, updated_at;
      `;

      const res = client ? await client.query<Product>(sql, values) : await query<Product>(sql, values);
      return res.rows[0] || null;
    } catch (err) {
      if (this.shouldUseMemoryFallback(err)) {
        const p = IN_MEMORY_PRODUCTS.find((item) => item.id === id);
        if (p) {
          Object.assign(p, updates, { updated_at: new Date().toISOString() });
          return p;
        }
        return null;
      }
      throw err;
    }
  }

  async adjustStock(id: string, adjustment: number, client?: PoolClient): Promise<Product | null> {
    try {
      const sql = `
        UPDATE products
        SET stock = stock + $1,
            updated_at = NOW()
        WHERE id = $2
          AND (stock + $1) >= 0
        RETURNING id, sku, slug, name, description, category, price_cents, currency, stock, is_active, image_url, created_at, updated_at;
      `;
      const res = client ? await client.query<Product>(sql, [adjustment, id]) : await query<Product>(sql, [adjustment, id]);
      return res.rows[0] || null;
    } catch (err) {
      if (this.shouldUseMemoryFallback(err)) {
        const p = IN_MEMORY_PRODUCTS.find((item) => item.id === id);
        if (p && p.stock + adjustment >= 0) {
          p.stock += adjustment;
          p.updated_at = new Date().toISOString();
          return p;
        }
        return null;
      }
      throw err;
    }
  }
}
