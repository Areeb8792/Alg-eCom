import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { logger } from '../logging/logger.js';
import { CustomerUserRepository } from '../repositories/customerUserRepository.js';

export interface AdminJwtPayload {
  userId: string;
  username: string;
  role: string;
}

export interface CustomerJwtPayload {
  userId: string;
  email: string;
  role: 'CUSTOMER';
}

declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminJwtPayload;
      customerUser?: CustomerJwtPayload;
    }
  }
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Missing or malformed Bearer token.'
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

    req.adminUser = decoded;
    next();
  } catch (err) {
    logger.warn({ err, correlationId: req.correlationId }, 'Invalid or expired Admin JWT token');
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid, malformed, or expired authentication token.'
      }
    });
  }
}

export function requireCustomerAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Customer authentication required. Missing or malformed Bearer token.'
      }
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as CustomerJwtPayload;
    if (!decoded.userId || decoded.role !== 'CUSTOMER') {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token claims. Customer credentials required.'
        }
      });
      return;
    }

    req.customerUser = decoded;
    next();
  } catch (err) {
    logger.warn({ err, correlationId: req.correlationId }, 'Invalid or expired Customer JWT token');
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid, malformed, or expired customer authentication token.'
      }
    });
  }
}

export function optionalCustomerAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as CustomerJwtPayload;
    if (decoded.userId && decoded.role === 'CUSTOMER') {
      req.customerUser = decoded;
    }
  } catch {
    // Optional token - continue as unauthenticated guest
  }
  next();
}

export async function requireVerifiedCustomerAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  requireCustomerAuth(req, res, async () => {
    if (!req.customerUser) return;
    try {
      const userRepo = new CustomerUserRepository();
      const user = await userRepo.findById(req.customerUser.userId);
      if (!user) {
        res.status(401).json({
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Customer account was not found.'
          }
        });
        return;
      }
      if (!user.is_verified) {
        res.status(403).json({
          error: {
            code: 'EMAIL_VERIFICATION_REQUIRED',
            message: 'Email verification is mandatory to complete orders and protected checkout operations. Please verify your email via the link sent to your address or request a new verification email.'
          }
        });
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  });
}
