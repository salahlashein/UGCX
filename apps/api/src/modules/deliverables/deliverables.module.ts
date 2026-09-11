import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deliverable } from './entities/deliverable.entity';
import { DeliverableFeedback } from './entities/deliverable-feedback.entity';
import { DeliverablesService } from './deliverables.service';
import { DeliverablesController } from './deliverables.controller';
import { StorageModule } from '../storage/storage.module';
import { CollaborationsModule } from '../collaborations/collaborations.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deliverable, DeliverableFeedback]),
    CollaborationsModule,
    TransactionsModule,
    BrandsModule,
    StorageModule,
  ],
  controllers: [DeliverablesController],
  providers: [DeliverablesService],
  exports: [DeliverablesService],
})
export class DeliverablesModule {}
