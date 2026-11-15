import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class ManualEscrowPaymentDto {
  @IsIn(['instapay', 'vodafone_cash'])
  method: 'instapay' | 'vodafone_cash';

  @IsNotEmpty()
  @IsString()
  transactionReference: string;

  @IsOptional()
  @IsString()
  senderAccount?: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}
