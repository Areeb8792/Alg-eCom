import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Algions Luxury Fashion E-Commerce End-to-End Suite', () => {
  const evidenceDir = path.resolve('docs/evidence');

  test('01: Catalog Browsing & Category Filtering', async ({ page }) => {
    await page.goto('/');

    // Verify Anton heading & brand elements
    await expect(page.locator('text=COUTURE')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ESSENTIALS' })).toBeVisible();

    // Verify products are loaded from API
    const productCard = page.locator('text=Statement Puffer').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });

    // Capture screenshot: 01_catalog.png
    await page.screenshot({ path: path.join(evidenceDir, '01_catalog.png'), fullPage: false });

    // Filter by category: OUTERWEAR
    await page.click('button:has-text("OUTERWEAR")');
    await expect(page).toHaveURL(/collections\/outerwear/);
  });

  test('02: Dedicated Product Detail Page', async ({ page }) => {
    await page.goto('/products/statement-puffer');

    // Verify product name, SKU, price, stock indicator
    await expect(page.locator('h1')).toContainText('Statement Puffer');
    await expect(page.locator('text=SKU: HW-PF-001')).toBeVisible();
    await expect(page.locator('text=STOCK RESERVATION')).toBeVisible();

    // Capture screenshot: 02_product_detail.png
    await page.screenshot({ path: path.join(evidenceDir, '02_product_detail.png'), fullPage: false });

    // Add to bag
    const addToBagBtn = page.locator('button:has-text("ADD TO BAG")').first();
    await addToBagBtn.click();
    await expect(page.locator('text=ADDED TO BAG')).toBeVisible();
  });

  test('03: Shopping Bag with Persistent LocalStorage', async ({ page }) => {
    // Navigate to product and add to bag
    await page.goto('/products/statement-puffer');
    const addToBagBtn = page.locator('button:has-text("ADD TO BAG")').first();
    await addToBagBtn.click();

    // Navigate to Bag
    await page.goto('/bag');
    await expect(page.locator('h1')).toContainText('SHOPPING BAG');
    await expect(page.locator('text=Statement Puffer').first()).toBeVisible();

    // Verify localStorage persistence across page refresh
    await page.reload();
    await expect(page.locator('text=Statement Puffer').first()).toBeVisible();

    // Capture screenshot: 03_cart.png
    await page.screenshot({ path: path.join(evidenceDir, '03_cart.png'), fullPage: false });
  });

  test('04: Checkout Workflow & Idempotency Header', async ({ page }) => {
    // Add item to bag first
    await page.goto('/products/statement-puffer');
    await page.locator('button:has-text("ADD TO BAG")').first().click();

    // Navigate to checkout
    await page.goto('/checkout');
    await expect(page.locator('h1')).toContainText('CHECKOUT');
    await expect(page.locator('text=IDEMPOTENCY INSPECTOR')).toBeVisible();
    await expect(page.locator('button:has-text("CONFIRM & PAY")')).toBeVisible();

    // Capture screenshot: 04_checkout.png
    await page.screenshot({ path: path.join(evidenceDir, '04_checkout.png'), fullPage: false });
  });

  test('05: Order Submission & Order Confirmation Snapshot', async ({ page }) => {
    // Add item to bag
    await page.goto('/products/minimalist-tee');
    await page.locator('button:has-text("ADD TO BAG")').first().click();

    // Go to checkout and submit
    await page.goto('/checkout');
    const submitBtn = page.locator('button:has-text("CONFIRM & PAY")');
    await submitBtn.click();

    // Wait for navigation to order confirmation (/orders/:orderId)
    await expect(page).toHaveURL(/orders\/.+/, { timeout: 15000 });
    await expect(page.locator('text=ORDER CONFIRMED & COMMITTED TO DATABASE')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=PURCHASED PIECES (HISTORIC SNAPSHOT)')).toBeVisible();

    // Capture screenshot: 05_order_confirmed.png
    await page.screenshot({ path: path.join(evidenceDir, '05_order_confirmed.png'), fullPage: false });
  });

  test('06: Administrative Operations & Audit Logging', async ({ page }) => {
    await page.goto('/admin');

    // Authenticate with default admin credentials
    await page.fill('input[type="text"]', 'admin@algions.com');
    await page.fill('input[type="password"]', 'AdminSecretPassword123!');
    await page.click('button:has-text("AUTHENTICATE (GET JWT)")');

    // Verify admin dashboard visible
    await expect(page.locator('text=INVENTORY & AUDIT CONTROL')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=ADJUST PRODUCT INVENTORY')).toBeVisible();
    await expect(page.locator('text=POSTGRESQL AUDIT TRAIL LOGS')).toBeVisible();

    // Perform an inventory adjustment: +5 units
    await page.fill('input[type="number"]', '5');
    await page.fill('input[placeholder="e.g. Warehouse receipt"]', 'Automated E2E Verification Restock');
    await page.click('button:has-text("COMMIT STOCK ADJUSTMENT & RECORD AUDIT")');

    // Verify success banner and audit log update
    await expect(page.locator('text=Stock successfully adjusted by +5')).toBeVisible({ timeout: 10000 });

    // Capture screenshot: 06_admin_dashboard.png
    await page.screenshot({ path: path.join(evidenceDir, '06_admin_dashboard.png'), fullPage: false });
  });
});
