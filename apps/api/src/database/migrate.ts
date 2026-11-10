import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from './connection.js';
import { logger } from '../logging/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(retries = 5): Promise<void> {
  logger.info('Starting database migrations...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  let client;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      client = await pool.connect();
      break;
    } catch (err) {
      if (attempt === retries) throw err;
      logger.warn({ attempt, err }, 'Failed to connect to database for migration, retrying in 2s...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (!client) {
    throw new Error('Database connection failed after multiple retries');
  }

  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    logger.info('Database migrations applied successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ err: error }, 'Failed to apply database migrations');
    throw error;
  } finally {
    client.release();
  }
}

// Execute directly if run as CLI script
const isMainScript = process.argv[1] && (
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) ||
  process.argv[1].endsWith('migrate.ts') ||
  process.argv[1].endsWith('migrate.js')
);

if (isMainScript) {
  runMigrations()
    .then(async () => {
      logger.info('Migration complete');
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ err }, 'Migration script error');
      await pool.end();
      process.exit(1);
    });
}
