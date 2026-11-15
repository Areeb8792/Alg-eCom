import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestCorrelationMiddleware } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';
import { config, Config } from './config/index.js';
import { getDevEmails, getDevEmailById } from './services/emailService.js';

export function createApp(appConfig: Config = config): Express {
  const app = express();

  // Basic security, trusted proxy and parsing middleware
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // Trust single reverse proxy hop (Nginx) to prevent IP spoofing

  // Environment-configurable CORS supporting explicit allowed origins for dev & production
  const allowedOrigins = appConfig.CORS_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const isProduction = appConfig.NODE_ENV === 'production';

  const corsOrigin = (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (e.g. mobile apps, curl, automated server probes, health checks)
    if (!requestOrigin) return callback(null, true);

    // Match against explicit allowed origins or wildcard subdomain patterns (e.g. *.vercel.app)
    const isAllowed = allowedOrigins.some((pattern) => {
      if (pattern === requestOrigin) return true;
      if (pattern.startsWith('*.')) {
        const rootDomain = pattern.slice(2);
        try {
          const originHost = new URL(requestOrigin).hostname;
          return originHost === rootDomain || originHost.endsWith('.' + rootDomain);
        } catch {
          return false;
        }
      }
      if (pattern.startsWith('https://*.') || pattern.startsWith('http://*.')) {
        const parts = pattern.split('://*.');
        const scheme = parts[0];
        const rootDomain = parts[1];
        try {
          const originUrl = new URL(requestOrigin);
          return originUrl.protocol === `${scheme}:` && (originUrl.hostname === rootDomain || originUrl.hostname.endsWith('.' + rootDomain));
        } catch {
          return false;
        }
      }
      return false;
    });

    if (isAllowed) {
      return callback(null, true);
    }

    // In development and test environments, allow wildcard and localhost/127.0.0.1 origins
    if (!isProduction) {
      if (allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      try {
        const url = new URL(requestOrigin);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          return callback(null, true);
        }
      } catch {
        // Ignore parse errors
      }
    }

    // In production, unlisted origins (including unlisted localhost ports) are rejected
    return callback(new Error(`CORS policy: origin ${requestOrigin} is not allowed`));
  };

  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Correlation & structured request logging
  app.use(requestCorrelationMiddleware);

  // Development Email Preview Routes (Restricted strictly to non-production environments)
  if (appConfig.NODE_ENV !== 'production') {
    app.get('/dev/emails', (_req, res) => {
      res.status(200).json({
        data: getDevEmails()
      });
    });

    app.get('/dev/emails/:id', (req, res) => {
      const email = getDevEmailById(req.params.id);
      if (!email) {
        res.status(404).json({
          error: {
            code: 'EMAIL_NOT_FOUND',
            message: `No development preview email with ID "${req.params.id}" found.`
          }
        });
        return;
      }
      if (req.accepts('html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(email.html);
      } else {
        res.status(200).json({ data: email });
      }
    });
  }

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
