import { Request, Response } from 'express';
import { HealthService } from '../services/healthService.js';
import { generatePrometheusMetrics } from '../metrics/prometheus.js';

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
    const output = generatePrometheusMetrics(isReady);

    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.status(200).send(output);
  };
}
