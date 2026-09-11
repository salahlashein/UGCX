import { IsEnum, IsInt, IsOptional, IsUrl, Min } from 'class-validator';
import { DeliverableType } from '../entities/deliverable.entity';

export class RegisterDeliverableDto {
  @IsEnum(DeliverableType)
  type: DeliverableType;

  @IsUrl({ require_tld: false })
  fileUrl: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationSeconds?: number;
}
