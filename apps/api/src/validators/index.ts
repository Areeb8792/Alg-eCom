import { z } from 'zod';

export const orderItemInputSchema = z.object({
  productId: z.string().uuid({ message: 'productId must be a valid UUID' }),
  quantity: z.number().int().positive({ message: 'quantity must be a positive integer' }).max(100, { message: 'Maximum quantity per item is 100' })
});

export const createOrderSchema = z.object({
  customerEmail: z.string().email({ message: 'customerEmail must be a valid email address' }),
  customerName: z.string().min(2, { message: 'customerName must be at least 2 characters' }).max(100),
  items: z.array(orderItemInputSchema).min(1, { message: 'Order must contain at least one item' })
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional().transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  limit: z.string().optional().transform((v) => (v ? Math.min(100, Math.max(1, parseInt(v, 10))) : 20))
});

export const updateProductSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().min(5).optional(),
  category: z.string().min(2).max(64).optional(),
  price_cents: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
  image_url: z.string().url().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const stockAdjustmentSchema = z.object({
  adjustment: z.number().int({ message: 'adjustment must be an integer (positive to add, negative to remove)' }),
  reason: z.string().min(3, { message: 'Reason for stock adjustment must be provided' }).max(255)
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

export const adminLoginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
