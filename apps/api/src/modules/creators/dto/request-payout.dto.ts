import { IsEnum, Matches } from 'class-validator';
import { PayoutMethod } from '../entities/creator-payout-detail.entity';

export class RequestPayoutDto {
  @Matches(/^\d{1,8}(\.\d{1,2})?$/, {
    message: 'amount must be a money string',
  })
  amount: string;

  @IsEnum(PayoutMethod)
  method: PayoutMethod;
}
