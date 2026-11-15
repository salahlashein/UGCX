import { IsOptional, IsUUID } from 'class-validator';
import { UpdateCampaignDto } from './update-campaign.dto';

export class CreateCampaignDto extends UpdateCampaignDto {
  @IsOptional()
  @IsUUID()
  productId?: string;
}
