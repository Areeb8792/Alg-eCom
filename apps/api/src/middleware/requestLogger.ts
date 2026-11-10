import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logging/logger.js';
import { recordHttpRequest } from '../metrics/prometheus.js';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      startTime: number;
    }
  }
}

export function requestCorrelationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers['x-correlation-id'] as string) || (req.headers['x-request-id'] as string) || uuidv4();
  req.correlationId = correlationId;
  req.startTime = Date.now();

  res.setHeader('X-Correlation-ID', correlationId);

  res.on('finish', () => {
    const durationMs = Date.now() - req.startTime;
    recordHttpRequest(req.method, req.originalUrl.split('?')[0], res.statusCode, durationMs);
    const logData = {
      correlationId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs,
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: req.ip || req.socket.remoteAddress
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'HTTP Request completed with server error');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'HTTP Request completed with client error');
    } else {
      logger.info(logData, 'HTTP Request completed successfully');
    }
  });

  next();
}
