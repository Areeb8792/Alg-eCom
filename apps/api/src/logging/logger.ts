import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["idempotency-key"]',
      'body.password',
      'body.token',
      'body.secret',
      'password',
      'jwt_secret',
      'DATABASE_URL'
    ],
    censor: '[REDACTED]'
  },
  base: {
    service: 'algions-product-order-api',
    env: config.NODE_ENV
  },
  timestamp: pino.stdTimeFunctions.isoTime
});
