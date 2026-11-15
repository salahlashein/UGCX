import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { User } from '../users/entities/user.entity';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { BrandsModule } from '../brands/brands.module';
import { ProductsModule } from '../products/products.module';
import { EscrowModule } from '../escrow/escrow.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { PaymentsModule } from '../payments/payments.module';
import { ProposalsModule } from '../proposals/proposals.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, User]),
    BrandsModule,
    ProductsModule,
    EscrowModule,
    TransactionsModule,
    forwardRef(() => ProposalsModule),
    forwardRef(() => PaymentsModule),
    NotificationsModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
