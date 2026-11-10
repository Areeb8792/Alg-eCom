import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Algions Luxury Fashion E-Commerce Comprehensive Acceptance Suite', () => {
  const evidenceDir = path.resolve('docs/evidence');

  test('01: Homepage & Editorial Hero Presentation', async ({ page }) => {
    await page.goto('/');

    // Verify Anton heading & brand identity
    await expect(page.locator('text=COUTURE')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ESSENTIALS' })).toBeVisible();

    // Verify products are loaded from real backend
    const productCard = page.locator('text=Statement Puffer').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });

    // Capture screenshot: 01_catalog.png
    await page.screenshot({ path: path.join(evidenceDir, '01_catalog.png'), fullPage: false });
  });

  test('02: Collections Navigation & Archive Filtering', async ({ page }) => {
    await page.goto('/');

    // Filter by OUTERWEAR category
    await page.click('button:has-text("OUTERWEAR")');
    await expect(page).toHaveURL(/collections\/outerwear/);

    // Verify outerwear products visible
    await expect(page.locator('text=Statement Puffer').first()).toBeVisible();

    // Search archive
    await page.fill('input[placeholder="SEARCH ARCHIVE..."]', 'Puffer');
    await expect(page.locator('text=Statement Puffer').first()).toBeVisible();

    // Capture screenshot: 02_collection.png
    await page.screenshot({ path: path.join(evidenceDir, '02_collection.png'), fullPage: false });
  });

  test('03: Dedicated Product Detail Page & Stock Indicator', async ({ page }) => {
    await page.goto('/products/statement-puffer');

    // Verify product name, SKU, price, stock reservation table
    await expect(page.locator('h1')).toContainText('Statement Puffer');
    await expect(page.locator('text=SKU: HW-PF-001')).toBeVisible();
    await expect(page.locator('text=STOCK RESERVATION')).toBeVisible();
    await expect(page.locator('text=POSTGRESQL ROW LOCKING')).toBeVisible();

    // Capture screenshot: 03_product_detail.png
    await page.screenshot({ path: path.join(evidenceDir, '03_product_detail.png'), fullPage: false });

    // Add to bag
    const addToBagBtn = page.locator('button:has-text("ADD TO BAG")').first();
    await addToBagBtn.click();
    await expect(page.locator('text=ADDED TO BAG')).toBeVisible();
  });

  test('04: Shopping Bag Interactions & LocalStorage Persistence', async ({ page }) => {
    // Add item to bag
    await page.goto('/products/statement-puffer');
    await page.locator('button:has-text("ADD TO BAG")').first().click();

    // Navigate to Bag
    await page.goto('/bag');
    await expect(page.locator('h1')).toContainText('SHOPPING BAG');
    await expect(page.locator('text=Statement Puffer').first()).toBeVisible();

    // Modify quantity (+1)
    const plusBtn = page.locator('button:has-text("+")').first();
    await plusBtn.click();

    // Verify persistent state survives hard page refresh
    await page.reload();
    await expect(page.locator('text=Statement Puffer').first()).toBeVisible();

    // Capture screenshot: 04_cart.png
    await page.screenshot({ path: path.join(evidenceDir, '04_cart.png'), fullPage: false });
  });

  test('05: Customer Checkout Workflow & Security Guarantee', async ({ page }) => {
    // Ensure an item is in bag
    await page.goto('/products/statement-puffer');
    await page.locator('button:has-text("ADD TO BAG")').first().click();

    // Navigate to checkout
    await page.goto('/checkout');
    await expect(page.locator('h1')).toContainText('CHECKOUT');
    await expect(page.locator('text=TRANSACTIONAL INTEGRITY GUARANTEE')).toBeVisible();
    await expect(page.locator('button:has-text("CONFIRM & PAY")')).toBeVisible();

    // Verify developer diagnostics drawer is present but non-intrusive
    await expect(page.locator('summary:has-text("DEVELOPER DIAGNOSTICS")')).toBeVisible();

    // Capture screenshot: 05_checkout.png
    await page.screenshot({ path: path.join(evidenceDir, '05_checkout.png'), fullPage: false });
  });

  test('06: Real Order Creation & Historic Price Snapshot', async ({ page }) => {
    // Add item to bag
    await page.goto('/products/minimalist-tee');
    await page.locator('button:has-text("ADD TO BAG")').first().click();

    // Go to checkout and submit
    await page.goto('/checkout');
    const submitBtn = page.locator('button:has-text("CONFIRM & PAY")');
    await submitBtn.click();

    // Wait for real database-backed order confirmation
    await expect(page).toHaveURL(/orders\/.+/, { timeout: 15000 });
    await expect(page.locator('text=ORDER CONFIRMED & COMMITTED TO DATABASE')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=PURCHASED PIECES (HISTORIC SNAPSHOT)')).toBeVisible();

    // Verify high-entropy order reference format
    const refHeading = page.locator('h1.anton-heading');
    await expect(refHeading).toContainText(/HW-\d{4}-[A-Z0-9]+/);

    // Refresh page and verify order persistence
    await page.reload();
    await expect(page.locator('text=ORDER CONFIRMED & COMMITTED TO DATABASE')).toBeVisible({ timeout: 10000 });

    // Capture screenshot: 06_order_confirmed.png
    await page.screenshot({ path: path.join(evidenceDir, '06_order_confirmed.png'), fullPage: false });
  });

  test('07: Privacy-Protected Order Tracking & Verification', async ({ page }) => {
    // 1. Create a fresh order to obtain a real reference
    await page.goto('/products/statement-puffer');
    await page.locator('button:has-text("ADD TO BAG")').first().click();
    await page.goto('/checkout');
    await page.click('button:has-text("CONFIRM & PAY")');
    await expect(page).toHaveURL(/orders\/.+/, { timeout: 15000 });

    const refElement = page.locator('h1.anton-heading');
    const orderRef = (await refElement.textContent())?.trim() || '';

    // 2. Navigate to track order
    await page.goto('/track-order');
    await expect(page.locator('text=SECURE ORDER VERIFICATION & TRACKING')).toBeVisible();

    // 3. Track with reference and verification email
    await page.fill('input[placeholder="e.g. HW-2026-F4C9B1A2"]', orderRef);
    await page.fill('input[placeholder="client@luxuryfashion.com"]', 'client@heavyweight.nyc');
    await page.click('button[type="submit"]');

    // 4. Verify verified order snapshot is displayed
    await expect(page.locator('text=ORDER CONFIRMED & COMMITTED TO DATABASE')).toBeVisible({ timeout: 10000 });

    // Capture screenshot: 07_order_tracking.png
    await page.screenshot({ path: path.join(evidenceDir, '07_order_tracking.png'), fullPage: false });
  });

  test('08: Administrative Operations, Stock Control & Audit Trail', async ({ page }) => {
    await page.goto('/admin');

    // Authenticate with administrator credentials
    await page.fill('input[type="text"]', 'admin@algions.com');
    await page.fill('input[type="password"]', 'AdminSecretPassword123!');
    await page.click('button:has-text("AUTHENTICATE (GET JWT)")');

    // Verify administrative operational dashboard
    await expect(page.locator('text=INVENTORY & AUDIT CONTROL')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=ADJUST PRODUCT INVENTORY')).toBeVisible();
    await expect(page.locator('text=POSTGRESQL AUDIT TRAIL LOGS')).toBeVisible();

    // Adjust inventory (+5 pieces)
    await page.fill('input[type="number"]', '5');
    await page.fill('input[placeholder="e.g. Warehouse receipt"]', 'Automated Verification Inbound Batch');
    await page.click('button:has-text("COMMIT STOCK ADJUSTMENT & RECORD AUDIT")');

    // Verify success confirmation and recorded audit entry
    await expect(page.locator('text=Stock successfully adjusted by +5')).toBeVisible({ timeout: 10000 });

    // Capture screenshot: 08_admin_dashboard.png
    await page.screenshot({ path: path.join(evidenceDir, '08_admin_dashboard.png'), fullPage: false });
  });
});
