import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { join } from 'path';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import type { AppConfig } from './config/configuration';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { BrandsModule } from './modules/brands/brands.module';
import { CreatorsModule } from './modules/creators/creators.module';
import { ProductsModule } from './modules/products/products.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ProposalsModule } from './modules/proposals/proposals.module';
import { AdminModule } from './modules/admin/admin.module';
import { CollaborationsModule } from './modules/collaborations/collaborations.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DeliverablesModule } from './modules/deliverables/deliverables.module';
import { MessagesModule } from './modules/messages/messages.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => ({
        type: 'postgres' as const,
        url: configService.get('database.url', { infer: true }),
        entities: [join(__dirname, 'modules', '**', '*.entity.{ts,js}')],
        // Migrations run as an explicit deploy step (see database skill),
        // never automatically and never via synchronize.
        migrationsRun: false,
        synchronize: false,
      }),
    }),
    // SEC-003: 10 requests/min, applied only to AuthController via
    // @UseGuards(ThrottlerGuard) so other routes are unaffected.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 10 }]),
    HealthModule,
    UsersModule,
    AuthModule,
    BrandsModule,
    CreatorsModule,
    ProductsModule,
    CampaignsModule,
    ProposalsModule,
    AdminModule,
    TransactionsModule,
    PaymentsModule,
    CollaborationsModule,
    DeliverablesModule,
    MessagesModule,
    StorageModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
