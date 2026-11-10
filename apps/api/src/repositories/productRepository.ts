import { PoolClient } from 'pg';
import { query } from '../database/connection.js';

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
  }

  async findById(id: string, client?: PoolClient): Promise<Product | null> {
    const sql = `
      SELECT id, sku, slug, name, description, category, price_cents, currency, stock, is_active, image_url, created_at, updated_at
      FROM products
      WHERE id = $1;
    `;
    const res = client ? await client.query<Product>(sql, [id]) : await query<Product>(sql, [id]);
    return res.rows[0] || null;
  }

  async deductStockAtomic(
    client: PoolClient,
    productId: string,
    quantity: number
  ): Promise<Product | null> {
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
  }

  async updateProduct(id: string, updates: Partial<Product>, client?: PoolClient): Promise<Product | null> {
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
  }

  async adjustStock(id: string, adjustment: number, client?: PoolClient): Promise<Product | null> {
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
  }
}
