import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';

// Loaded by the TypeORM CLI (migration:generate / migration:run) which runs
// outside Nest's bootstrap, so env vars are not yet populated by ConfigModule.
config();

/**
 * Single source of truth for both the TypeORM CLI and the NestJS
 * TypeOrmModule (see app.module.ts). synchronize stays false everywhere;
 * schema changes ship as migrations per the database skill.
 */
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [join(__dirname, '..', 'modules', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
  synchronize: false,
});

export default AppDataSource;
