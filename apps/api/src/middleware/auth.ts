import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { logger } from '../logging/logger.js';

export interface AdminJwtPayload {
  userId: string;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminJwtPayload;
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
    logger.warn({ err, correlationId: req.correlationId }, 'Invalid or expired JWT token');
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid, malformed, or expired authentication token.'
      }
    });
  }
}
