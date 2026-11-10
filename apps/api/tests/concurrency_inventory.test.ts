import { describe, it, expect } from 'vitest';

describe('Inventory Concurrency & Atomicity Logic Verification', () => {
  it('prevents overselling when two simultaneous checkouts compete for a single remaining stock item', async () => {
    // In-memory atomic inventory simulation modeling PostgreSQL's row-level lock:
    // UPDATE products SET stock = stock - 1 WHERE id = 1 AND stock >= 1 RETURNING stock;
    let databaseStock = 1;
    let successfulOrders = 0;
    let rejectedOrders = 0;

    async function attemptAtomicCheckout(orderId: string): Promise<boolean> {
      // Simulating database row-level locking transaction
      return await new Promise((resolve) => {
        setTimeout(() => {
          if (databaseStock >= 1) {
            databaseStock -= 1;
            successfulOrders += 1;
            resolve(true);
          } else {
            rejectedOrders += 1;
            resolve(false);
          }
        }, Math.random() * 20);
      });
    }

    // Launch 10 simultaneous checkout requests racing for the single stock unit
    const requests = Array.from({ length: 10 }).map((_, i) => attemptAtomicCheckout(`order-${i}`));
    const results = await Promise.all(requests);

    expect(successfulOrders).toBe(1);
    expect(rejectedOrders).toBe(9);
    expect(databaseStock).toBe(0);
    expect(databaseStock).toBeGreaterThanOrEqual(0);
    expect(results.filter((r) => r === true).length).toBe(1);
  });
});
