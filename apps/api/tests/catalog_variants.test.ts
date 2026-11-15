import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Application } from 'express';

describe('Catalog, Categories, Collections & Variants API', () => {
  let app: Application;

  beforeAll(() => {
    process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';
    app = createApp();
  });
  it('GET /api/v1/categories returns hierarchical category tree', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const menswear = res.body.data.find((c: any) => c.slug === 'menswear');
    expect(menswear).toBeDefined();
    expect(menswear.name).toBe('MENSWEAR');
    expect(Array.isArray(menswear.children)).toBe(true);
    expect(menswear.children.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/collections returns curated collections', async () => {
    const res = await request(app).get('/api/v1/collections');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const s04 = res.body.data.find((c: any) => c.slug === 'season-04-brutalist');
    expect(s04).toBeDefined();
    expect(s04.name).toBe('Season 04 // Brutalist Heavy');
  });

  it('GET /api/v1/recommendations returns curated recommendation list', async () => {
    const res = await request(app).get('/api/v1/recommendations');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/products supports multi-facet filtering', async () => {
    // 1. Filter by category
    const resCat = await request(app).get('/api/v1/products?category=OUTERWEAR');
    expect(resCat.status).toBe(200);
    expect(resCat.body.data.every((p: any) => p.category === 'OUTERWEAR')).toBe(true);

    // 2. Filter by size
    const resSize = await request(app).get('/api/v1/products?size=M');
    expect(resSize.status).toBe(200);
    expect(resSize.body.data.length).toBeGreaterThan(0);
    // Every returned product must have a variant with size M
    for (const prod of resSize.body.data) {
      if (prod.variants) {
        expect(prod.variants.some((v: any) => v.size.toUpperCase() === 'M')).toBe(true);
      }
    }

    // 3. Filter by color
    const resColor = await request(app).get('/api/v1/products?color=Black');
    expect(resColor.status).toBe(200);
    expect(resColor.body.data.length).toBeGreaterThan(0);

    // 4. Filter by fit
    const resFit = await request(app).get('/api/v1/products?fit=OVERSIZED');
    expect(resFit.status).toBe(200);
    expect(resFit.body.data.every((p: any) => p.fit_type === 'OVERSIZED')).toBe(true);

    // 5. Price range filter
    const resPrice = await request(app).get('/api/v1/products?minPrice=5000&maxPrice=15000');
    expect(resPrice.status).toBe(200);
    expect(resPrice.body.data.every((p: any) => p.price_cents >= 5000 && p.price_cents <= 15000)).toBe(true);

    // 6. Sorting
    const resSortAsc = await request(app).get('/api/v1/products?sort=price_asc');
    expect(resSortAsc.status).toBe(200);
    const prices = resSortAsc.body.data.map((p: any) => p.price_cents);
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });

  it('GET /api/v1/products/:id returns product with variants and image gallery', async () => {
    const listRes = await request(app).get('/api/v1/products?limit=1');
    const productId = listRes.body.data[0].id;

    const res = await request(app).get(`/api/v1/products/${productId}`);
    expect(res.status).toBe(200);
    const product = res.body.data;
    expect(product.id).toBe(productId);
    expect(Array.isArray(product.variants)).toBe(true);
    expect(product.variants.length).toBeGreaterThan(0);
    expect(Array.isArray(product.images)).toBe(true);
    expect(product.images.length).toBeGreaterThan(0);
    expect(product.fit_type).toBeDefined();
    expect(product.fabric_weight).toBeDefined();
    expect(product.composition).toBeDefined();
  });
});
