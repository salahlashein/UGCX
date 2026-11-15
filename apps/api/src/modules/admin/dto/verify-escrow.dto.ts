import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class VerifyEscrowDto {
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
