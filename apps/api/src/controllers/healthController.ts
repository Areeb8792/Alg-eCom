import { Request, Response } from 'express';
import { HealthService } from '../services/healthService.js';

export class HealthController {
  private service = new HealthService();

  live = (_req: Request, res: Response): void => {
    const liveness = this.service.getLiveness();
    res.status(200).json(liveness);
  };

  ready = async (_req: Request, res: Response): Promise<void> => {
    const { isReady, health } = await this.service.getReadiness();
    const statusCode = isReady ? 200 : 503;
    res.status(statusCode).json(health);
  };

  metrics = async (_req: Request, res: Response): Promise<void> => {
    const { isReady } = await this.service.getReadiness();
    const memory = process.memoryUsage();
    const uptime = process.uptime();

    const output = [
      '# HELP process_uptime_seconds Total application process uptime in seconds',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${uptime}`,
      '',
      '# HELP process_resident_memory_bytes Resident memory size in bytes',
      '# TYPE process_resident_memory_bytes gauge',
      `process_resident_memory_bytes ${memory.rss}`,
      '',
      '# HELP database_up Database connection health status (1 for connected, 0 for disconnected)',
      '# TYPE database_up gauge',
      `database_up ${isReady ? 1 : 0}`,
      ''
    ].join('\n');

    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.status(200).send(output);
  };
}
