import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OrderService } from '../services/orderService.js';
import { createOrderSchema } from '../validators/index.js';
import { recordOrderCreated, recordOrderReplayed } from '../metrics/prometheus.js';
import { config } from '../config/index.js';
import { AdminJwtPayload } from '../middleware/auth.js';
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
        recordOrderReplayed();
        res.setHeader('X-Idempotent-Replayed', 'true');
        res.status(result.cachedStatusCode || 200).json(result.cachedBody);
        return;
      }

      recordOrderCreated();

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
      const verifyEmail = ((req.query.email as string) || '').toLowerCase().trim();
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

      // 1. Strict Administrator Authentication Verification
      let isAdmin = false;
      const authHeader = req.headers.authorization;

      if (authHeader) {
        if (!authHeader.startsWith('Bearer ')) {
          res.status(401).json({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required. Malformed Bearer token.'
            }
          });
          return;
        }

        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, config.JWT_SECRET) as AdminJwtPayload;
          if (decoded.role !== 'ADMIN') {
            res.status(403).json({
              error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions. Admin role required.'
              }
            });
            return;
          }
          isAdmin = true;
        } catch {
          res.status(401).json({
            error: {
              code: 'INVALID_TOKEN',
              message: 'Invalid, malformed, or expired authentication token.'
            }
          });
          return;
        }
      }

      // If verified as administrator via valid JWT, return full unmasked order
      if (isAdmin) {
        res.status(200).json({ data: order });
        return;
      }

      // 2. Customer Access Verification: If verification email is supplied, enforce exact match
      if (verifyEmail) {
        if (order.customer_email.toLowerCase() !== verifyEmail) {
          // Email mismatch: Customer attempting to access another customer's order
          res.status(403).json({
            error: {
              code: 'ORDER_ACCESS_DENIED',
              message: 'The verification email provided does not match the order record.'
            }
          });
          return;
        }
      }

      // 3. Public Customer Lookups & Tracking: Strictly return privacy-masked data
      // Knowing or matching an order reference/email does not grant access to full customer PII;
      // full unmasked customer details are strictly reserved for authenticated administrators.
      const maskedEmail = order.customer_email.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => {
        return `${first}${'*'.repeat(Math.min(middle.length, 4))}${domain}`;
      });
      const maskedName = order.customer_name
        .split(' ')
        .map((n) => (n.length > 1 ? `${n[0]}***` : n))
        .join(' ');

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
