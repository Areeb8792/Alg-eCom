import { describe, it, expect } from 'vitest';
import {
  createOrderSchema,
  productQuerySchema,
  updateProductSchema,
  stockAdjustmentSchema
} from '../src/validators/index.js';

describe('Zod Schema Validators', () => {
  describe('createOrderSchema', () => {
    it('accepts valid order input', () => {
      const valid = {
        customerEmail: 'test@example.com',
        customerName: 'Test Buyer',
        items: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440000',
            quantity: 2
          }
        ]
      };
      const parsed = createOrderSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const invalid = {
        customerEmail: 'not-an-email',
        customerName: 'Test Buyer',
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 }]
      };
      const parsed = createOrderSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it('rejects non-UUID productId', () => {
      const invalid = {
        customerEmail: 'test@example.com',
        customerName: 'Test Buyer',
        items: [{ productId: 'invalid-id-123', quantity: 1 }]
      };
      const parsed = createOrderSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it('rejects zero or negative quantities', () => {
      const invalidZero = {
        customerEmail: 'test@example.com',
        customerName: 'Test Buyer',
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 0 }]
      };
      expect(createOrderSchema.safeParse(invalidZero).success).toBe(false);

      const invalidNegative = {
        customerEmail: 'test@example.com',
        customerName: 'Test Buyer',
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440000', quantity: -3 }]
      };
      expect(createOrderSchema.safeParse(invalidNegative).success).toBe(false);
    });

    it('rejects empty items array', () => {
      const invalidEmpty = {
        customerEmail: 'test@example.com',
        customerName: 'Test Buyer',
        items: []
      };
      expect(createOrderSchema.safeParse(invalidEmpty).success).toBe(false);
    });
  });

  describe('stockAdjustmentSchema', () => {
    it('accepts valid positive or negative stock adjustments with reason', () => {
      expect(stockAdjustmentSchema.safeParse({ adjustment: 5, reason: 'New shipment restock' }).success).toBe(true);
      expect(stockAdjustmentSchema.safeParse({ adjustment: -2, reason: 'Damaged item removal' }).success).toBe(true);
    });

    it('rejects adjustment without reason', () => {
      expect(stockAdjustmentSchema.safeParse({ adjustment: 5, reason: '' }).success).toBe(false);
    });
  });
});
