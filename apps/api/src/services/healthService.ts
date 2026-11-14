import { pool } from '../database/connection.js';
import { logger } from '../logging/logger.js';

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  service: string;
  checks?: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTimeMs?: number;
      user?: string;
      error?: string;
    };
  };
}

export class HealthService {
  private startTime = Date.now();

  getLiveness(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      service: 'algions-product-order-api'
    };
  }

  async getReadiness(): Promise<{ isReady: boolean; health: HealthStatus }> {
    const start = Date.now();
    let dbStatus: 'healthy' | 'unhealthy' = 'unhealthy';
    let responseTimeMs: number | undefined;
    let currentUser: string | undefined;
    let errorMessage: string | undefined;

    try {
      // Direct query check with 3-second timeout and identity inspection
      const result = await pool.query<{ current_user?: string }>('SELECT current_user, 1;');
      responseTimeMs = Date.now() - start;
      currentUser = result.rows[0]?.current_user;
      dbStatus = 'healthy';
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : 'Database ping failed';
      logger.error({ err }, 'Readiness check database probe failed');
    }

    const isReady = dbStatus === 'healthy';

    const health: HealthStatus = {
      status: isReady ? 'ok' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      service: 'algions-product-order-api',
      checks: {
        database: {
          status: dbStatus,
          responseTimeMs,
          user: currentUser,
          error: errorMessage
        }
      }
    };

    return { isReady, health };
  }
}
