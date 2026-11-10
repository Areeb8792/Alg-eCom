import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './logging/logger.js';
import { closePool } from './database/connection.js';

const app = createApp();

const server = app.listen(config.PORT, config.HOST, () => {
  logger.info(
    {
      port: config.PORT,
      host: config.HOST,
      env: config.NODE_ENV
    },
    `🚀 Algions Product & Order API service started successfully`
  );
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Received termination signal. Starting graceful shutdown sequence...');

  server.close(async () => {
    logger.info('HTTP server closed. Stopping background workers and closing database connections...');
    try {
      await closePool();
      logger.info('Database pool closed cleanly. Process exiting.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during graceful pool shutdown');
      process.exit(1);
    }
  });

  // Force close if graceful shutdown takes longer than 10 seconds
  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded (10s). Forcing immediate termination.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Promise rejection encountered');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception encountered');
  process.exit(1);
});
