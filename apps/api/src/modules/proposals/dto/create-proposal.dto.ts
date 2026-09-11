import {
  IsInt,
  IsNumber,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProposalDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsInt()
  @Min(1)
  @Max(90)
  deliveryDays: number;

  @IsString()
  @MinLength(1)
  pitch: string;
}
