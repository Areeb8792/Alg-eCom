import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService.js';
import { createOrderSchema } from '../validators/index.js';
import {
  IdempotencyConflictError,
  IdempotencyInProgressError,
  InsufficientStockError,
  ProductNotFoundError
} from '../repositories/orderRepository.js';

export class OrderController {
  private service = new OrderService();

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
      const validatedInput = createOrderSchema.parse(req.body);

      const result = await this.service.createOrder(validatedInput, idempotencyKey);

      if (result.isDuplicate) {
        res.setHeader('X-Idempotent-Replayed', 'true');
        res.status(result.cachedStatusCode || 200).json(result.cachedBody);
        return;
      }

      res.status(201).json({
        data: {
          order: result.order
        }
      });
    } catch (error) {
      if (error instanceof IdempotencyConflictError) {
        res.status(409).json({
          error: {
            code: 'IDEMPOTENCY_CONFLICT',
            message: error.message
          }
        });
        return;
      }

      if (error instanceof IdempotencyInProgressError) {
        res.status(409).json({
          error: {
            code: 'IDEMPOTENCY_IN_PROGRESS',
            message: error.message
          }
        });
        return;
      }

      if (error instanceof InsufficientStockError) {
        res.status(400).json({
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: error.message,
            productId: error.productId,
            available: error.available,
            requested: error.requested
          }
        });
        return;
      }

      if (error instanceof ProductNotFoundError) {
        res.status(400).json({
          error: {
            code: 'PRODUCT_UNAVAILABLE',
            message: error.message
          }
        });
        return;
      }

      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const verifyEmail = (req.query.email as string || '').toLowerCase().trim();
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      const order = isUUID
        ? await this.service.getOrderById(id)
        : await this.service.getOrderByReference(id);

      if (!order) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Order "${id}" was not found.`
          }
        });
        return;
      }

      // Check privacy: If client provides matching email or has admin header, reveal full PII
      const hasEmailMatch = verifyEmail && order.customer_email.toLowerCase() === verifyEmail;
      const authHeader = req.headers.authorization;
      const isAdmin = authHeader && authHeader.startsWith('Bearer ');

      if (hasEmailMatch || isAdmin) {
        res.status(200).json({ data: order });
        return;
      }

      // Mask PII for public unverified lookup to protect customer privacy
      const maskedEmail = order.customer_email.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => {
        return `${first}${'*'.repeat(Math.min(middle.length, 4))}${domain}`;
      });
      const maskedName = order.customer_name.split(' ').map((n) => `${n[0]}***`).join(' ');

      res.status(200).json({
        data: {
          ...order,
          customer_email: maskedEmail,
          customer_name: maskedName,
          is_privacy_masked: true
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
