import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { BrandMember } from './entities/brand-member.entity';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Collaboration } from '../collaborations/entities/collaboration.entity';
import { Deliverable } from '../deliverables/entities/deliverable.entity';
import { Proposal } from '../proposals/entities/proposal.entity';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { BrandMembersService } from './brand-members.service';
import { BrandMembersController } from './brand-members.controller';
import { BrandRoleGuard } from './guards/brand-role.guard';
import { R2StorageModule } from '../storage/r2-storage.module';
import { BillingService } from './billing.service';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Brand,
      BrandMember,
      User,
      Transaction,
      Campaign,
      Collaboration,
      Deliverable,
      Proposal,
    ]),
    R2StorageModule,
  ],
  controllers: [BrandsController, BrandMembersController],
  providers: [
    BrandsService,
    BrandMembersService,
    BillingService,
    DashboardService,
    BrandRoleGuard,
  ],
  exports: [
    BrandsService,
    BrandMembersService,
    BillingService,
    DashboardService,
    BrandRoleGuard,
  ],
})
export class BrandsModule {}
