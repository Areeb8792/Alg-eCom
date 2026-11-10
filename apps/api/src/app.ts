import express, { Express } from 'express';
import cors from 'cors';
import { requestCorrelationMiddleware } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';
import { config } from './config/index.js';

export function createApp(): Express {
  const app = express();

  // Basic security, trusted proxy and parsing middleware
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // Trust single reverse proxy hop (Nginx) to prevent IP spoofing

  // Environment-configurable CORS supporting explicit allowed origins for dev & production
  const allowedOrigins = config.CORS_ORIGIN.split(',').map((o) => o.trim());
  const corsOrigin =
    allowedOrigins.length === 1 && allowedOrigins[0] === '*'
      ? '*'
      : (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          // Allow requests with no origin (e.g. mobile apps, curl, automated server probes)
          if (!requestOrigin) return callback(null, true);
          if (allowedOrigins.includes(requestOrigin) || allowedOrigins.includes('*')) {
            return callback(null, true);
          }
          return callback(new Error(`CORS policy: origin ${requestOrigin} is not allowed`));
        };

  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Correlation & structured request logging
  app.use(requestCorrelationMiddleware);

  // Mount API endpoints
  app.use('/api/v1', apiRouter);

  // Fallback 404 handler for undefined API routes
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `The endpoint ${req.method} ${req.originalUrl} does not exist.`
      }
    });
  });

  // Global centralized error handler
  app.use(errorHandler);

  return app;
}
