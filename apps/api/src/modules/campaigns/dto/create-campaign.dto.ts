import { IsUUID } from 'class-validator';

export class CreateCampaignDto {
  @IsUUID()
  productId: string;
}
