import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Creator } from './entities/creator.entity';
import { CreatorPortfolioItem } from './entities/creator-portfolio-item.entity';
import { CreatorPayoutDetail } from './entities/creator-payout-detail.entity';
import { PayoutRequest } from './entities/payout-request.entity';
import { CreatorsService } from './creators.service';
import { CreatorsController } from './creators.controller';

import { Collaboration } from '../collaborations/entities/collaboration.entity';
import { Message } from '../messages/entities/message.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Deliverable } from '../deliverables/entities/deliverable.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Product } from '../products/entities/product.entity';
import { Brand } from '../brands/entities/brand.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Creator,
      CreatorPortfolioItem,
      CreatorPayoutDetail,
      PayoutRequest,
      Collaboration,
      Message,
      Transaction,
      Deliverable,
      Campaign,
      Product,
      Brand,
    ]),
  ],
  controllers: [CreatorsController],
  providers: [CreatorsService],
  exports: [CreatorsService],
})
export class CreatorsModule {}
