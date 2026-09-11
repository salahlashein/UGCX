import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  Logger,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Pool } from 'pg';

export const PG_POOL = 'PG_POOL';

/**
 * GET /api/v1/health checks database connectivity with a lightweight
 * SELECT 1 and returns the envelope from REQ-003. Responds with 503,
 * not a thrown 500, when the database is unreachable.
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Get()
  async check(@Res() res: Response): Promise<void> {
    try {
      await this.pool.query('SELECT 1');
      res.status(HttpStatus.OK).json({ status: 'ok', database: 'connected' });
    } catch (error) {
      this.logger.warn(
        `Database health check failed: ${(error as Error).message}`,
      );
      res
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .json({ status: 'degraded', database: 'disconnected' });
    }
  }
}
