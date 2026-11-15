import {
  IsInt,
  IsNumber,
  IsString,
  Max,
  MaxLength,
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
  @MaxLength(600)
  pitch: string;
}
