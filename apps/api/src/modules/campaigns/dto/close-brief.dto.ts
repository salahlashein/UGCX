import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CloseBriefDto {
  @IsOptional()
  @IsString()
  @MaxLength(280)
  reason?: string;
}
