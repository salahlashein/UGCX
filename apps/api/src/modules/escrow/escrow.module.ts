import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { EscrowService } from './escrow.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign]),
    TransactionsModule,
    ConfigModule,
  ],
  providers: [EscrowService],
  exports: [EscrowService],
})
export class EscrowModule {}
