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
  app.use(cors({ origin: config.CORS_ORIGIN }));
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
