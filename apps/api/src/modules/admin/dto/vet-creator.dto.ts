import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { VettingStatus } from '../../creators/entities/creator.entity';

export class VetCreatorDto {
  @IsIn([VettingStatus.APPROVED, VettingStatus.REJECTED])
  status: VettingStatus.APPROVED | VettingStatus.REJECTED;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
