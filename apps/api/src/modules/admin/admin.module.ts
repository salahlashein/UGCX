import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Creator } from '../creators/entities/creator.entity';
import { AdminCreatorsService } from './admin-creators.service';
import { AdminCreatorsController } from './admin-creators.controller';
import { AdminPayoutsService } from './admin-payouts.service';
import { AdminPayoutsController } from './admin-payouts.controller';
import { ProposalsModule } from '../proposals/proposals.module';
import { CollaborationsModule } from '../collaborations/collaborations.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Creator]),
    ProposalsModule,
    CollaborationsModule,
    TransactionsModule,
  ],
  controllers: [AdminCreatorsController, AdminPayoutsController],
  providers: [AdminCreatorsService, AdminPayoutsService],
})
export class AdminModule {}
