import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipRequestMap = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequestMap.entries()) {
    if (now > record.resetTime) {
      ipRequestMap.delete(ip);
    }
  }
}, 300000);

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const { windowMs, maxRequests, message = 'Rate limit exceeded. Please try again later.' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, allow unlimited requests unless explicitly testing rate limits
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();

    const record = ipRequestMap.get(ip);

    if (!record || now > record.resetTime) {
      ipRequestMap.set(ip, {
        count: 1,
        resetTime: now + windowMs
      });
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - 1).toString());
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds.toString());
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');

      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfterSeconds
        }
      });
      return;
    }

    record.count += 1;
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());
    next();
  };
}

export const orderLookupLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // max 30 lookups per minute
  message: 'Too many order lookup requests. For client privacy, please wait before retrying.'
});
