import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Creator } from '../creators/entities/creator.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { AdminCreatorsService } from './admin-creators.service';
import { AdminCreatorsController } from './admin-creators.controller';
import { AdminPayoutsService } from './admin-payouts.service';
import { AdminPayoutsController } from './admin-payouts.controller';
import { AdminCampaignsService } from './admin-campaigns.service';
import { AdminCampaignsController } from './admin-campaigns.controller';
import { ProposalsModule } from '../proposals/proposals.module';
import { CollaborationsModule } from '../collaborations/collaborations.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EscrowModule } from '../escrow/escrow.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Creator, Campaign]),
    ProposalsModule,
    CollaborationsModule,
    TransactionsModule,
    NotificationsModule,
    EscrowModule,
  ],
  controllers: [
    AdminCreatorsController,
    AdminPayoutsController,
    AdminCampaignsController,
  ],
  providers: [AdminCreatorsService, AdminPayoutsService, AdminCampaignsService],
})
export class AdminModule {}
