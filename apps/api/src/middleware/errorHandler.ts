import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../logging/logger.js';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const correlationId = req.correlationId || 'unknown';

  if (err instanceof ZodError) {
    const formatted = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }));

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload failed schema validation.',
        details: formatted
      }
    });
    return;
  }

  if (err instanceof SyntaxError && 'body' in (err as unknown as Record<string, unknown>)) {
    res.status(400).json({
      error: {
        code: 'MALFORMED_JSON',
        message: 'Request body contains invalid JSON syntax.'
      }
    });
    return;
  }

  logger.error(
    {
      err,
      correlationId,
      url: req.originalUrl,
      method: req.method
    },
    'Unhandled internal server exception'
  );

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred. Please contact system support with correlationId.',
      correlationId
    }
  });
}
