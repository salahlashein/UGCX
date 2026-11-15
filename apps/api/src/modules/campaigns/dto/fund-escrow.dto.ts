import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export class FundEscrowDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(100)
  amount?: number;

  @IsOptional()
  @IsIn(['card', 'bank_transfer'])
  method?: 'card' | 'bank_transfer' = 'card';
}
