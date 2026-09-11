import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from './entities/proposal.entity';
import { ProposalsService } from './proposals.service';
import { ProposalsController } from './proposals.controller';
import { CreatorsModule } from '../creators/creators.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proposal]),
    CreatorsModule,
    CampaignsModule,
    BrandsModule,
  ],
  controllers: [ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}
