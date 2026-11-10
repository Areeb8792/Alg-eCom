import { PoolClient } from 'pg';
import { query } from '../database/connection.js';
import { IN_MEMORY_PRODUCTS } from '../database/inMemoryStore.js';
import { config } from '../config/index.js';

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

export class ProductRepository {
  async findAll(params: { category?: string; search?: string; offset: number; limit: number }): Promise<{ products: Product[]; total: number }> {
    try {
      const conditions: string[] = ['is_active = TRUE'];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (params.category) {
        conditions.push(`category = $${paramIndex++}`);
        values.push(params.category.toUpperCase());
      }

      if (params.search) {
        conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR sku ILIKE $${paramIndex})`);
        values.push(`%${params.search}%`);
        paramIndex++;
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const countQuery = `SELECT COUNT(*) AS total FROM products ${whereClause};`;
      const countRes = await query<{ total: string }>(countQuery, values);
      const total = parseInt(countRes.rows[0].total, 10);

      const listQuery = `
        SELECT id, sku, slug, name, description, category, price_cents, currency, stock, is_active, image_url, created_at, updated_at
        FROM products
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++};
      `;
      const listRes = await query<Product>(listQuery, [...values, params.limit, params.offset]);

      return { products: listRes.rows, total };
    } catch (err) {
      if (config.NODE_ENV !== 'test') {
        let filtered = IN_MEMORY_PRODUCTS.filter((p) => p.is_active);
        if (params.category) {
          filtered = filtered.filter((p) => p.category.toUpperCase() === params.category?.toUpperCase());
        }
        if (params.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(
            (p) => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s)
          );
        }
        const total = filtered.length;
        const page = filtered.slice(params.offset, params.offset + params.limit);
        return { products: page, total };
      }
      throw err;
    }
  }

  async findById(id: string, client?: PoolClient): Promise<Product | null> {
    try {
      const sql = `
        SELECT id, sku, slug, name, description, category, price_cents, currency, stock, is_active, image_url, created_at, updated_at
        FROM products
        WHERE id = $1;
      `;
      const res = client ? await client.query<Product>(sql, [id]) : await query<Product>(sql, [id]);
      return res.rows[0] || null;
    } catch (err) {
      if (config.NODE_ENV !== 'test') {
        const found = IN_MEMORY_PRODUCTS.find((p) => p.id === id);
        return found || null;
      }
      throw err;
    }
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
      if (config.NODE_ENV !== 'test') {
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
      if (config.NODE_ENV !== 'test') {
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
      if (config.NODE_ENV !== 'test') {
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
