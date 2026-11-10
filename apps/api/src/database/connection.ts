import pg from 'pg';
import { getDatabaseConnectionString, config } from '../config/index.js';
import { logger } from '../logging/logger.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: getDatabaseConnectionString(),
  min: config.DB_POOL_MIN,
  max: config.DB_POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database client error on idle pool connection');
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug({ text, duration, rowCount: res.rowCount }, 'Database query executed');
    return res;
  } catch (error) {
    logger.error({ text, err: error }, 'Database query failed');
    throw error;
  }
}

export async function getClient(): Promise<pg.PoolClient> {
  return await pool.connect();
}

export async function closePool(): Promise<void> {
  logger.info('Closing database pool...');
  await pool.end();
  logger.info('Database pool closed');
}
