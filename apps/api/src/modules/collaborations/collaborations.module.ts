import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaboration } from './entities/collaboration.entity';
import { CollaborationsService } from './collaborations.service';
import { CollaborationsController } from './collaborations.controller';
import { ProposalsModule } from '../proposals/proposals.module';
import { BrandsModule } from '../brands/brands.module';
import { CreatorsModule } from '../creators/creators.module';
import { UsersModule } from '../users/users.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Collaboration]),
    ProposalsModule,
    BrandsModule,
    CreatorsModule,
    UsersModule,
    TransactionsModule,
    // forwardRef: PaymentsModule's webhook controller also depends on
    // CollaborationsService, making this a legitimate two-way dependency.
    forwardRef(() => PaymentsModule),
  ],
  controllers: [CollaborationsController],
  providers: [CollaborationsService],
  exports: [CollaborationsService],
})
export class CollaborationsModule {}
