import { IsIn, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class TopUpEscrowDto {
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number;

  @IsOptional()
  @IsIn(['card', 'bank_transfer'])
  method?: 'card' | 'bank_transfer' = 'card';
}
