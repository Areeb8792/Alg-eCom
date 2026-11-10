import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from './connection.js';
import { logger } from '../logging/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<void> {
  logger.info('Starting database migrations...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
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
if (process.argv[1] === fileURLToPath(import.meta.url)) {
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
