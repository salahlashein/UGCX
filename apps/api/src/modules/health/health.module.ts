import { Inject, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { HealthController, PG_POOL } from './health.controller';
import type { AppConfig } from '../../config/configuration';

const logger = new Logger('PgPool');

@Module({
  imports: [ConfigModule],
  controllers: [HealthController],
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => {
        const pool = new Pool({
          connectionString: configService.get('database.url', { infer: true }),
        });
        // node-postgres emits 'error' on idle-client failures (e.g. the
        // database going down). Without a listener this crashes the whole
        // process instead of letting the health check degrade gracefully.
        pool.on('error', (error) => {
          logger.warn(`Idle database client error: ${error.message}`);
        });
        return pool;
      },
    },
  ],
})
export class HealthModule implements OnModuleDestroy {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
