import { IsDateString, IsEnum, IsString, MinLength } from 'class-validator';
import { PayoutMethod } from '../../transactions/entities/transaction.entity';

/** TASK-P1-010: the ops evidence trail required to mark a payout paid. */
export class MarkPaidDto {
  @IsEnum(PayoutMethod)
  method: PayoutMethod;

  @IsString()
  @MinLength(1)
  reference: string;

  @IsDateString()
  paidAt: string;
}
