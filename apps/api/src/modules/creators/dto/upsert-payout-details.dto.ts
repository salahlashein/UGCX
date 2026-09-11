import { IsEnum, IsString, MaxLength } from 'class-validator';
import { PayoutMethod } from '../entities/creator-payout-detail.entity';

export class UpsertPayoutDetailsDto {
  @IsEnum(PayoutMethod)
  method: PayoutMethod;

  @IsString()
  @MaxLength(100)
  accountIdentifier: string;

  @IsString()
  @MaxLength(200)
  holderName: string;
}
