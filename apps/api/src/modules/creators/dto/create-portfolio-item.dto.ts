import { IsEnum, IsUrl } from 'class-validator';
import { PortfolioMediaType } from '../entities/creator-portfolio-item.entity';

export class CreatePortfolioItemDto {
  @IsUrl()
  mediaUrl: string;

  @IsEnum(PortfolioMediaType)
  mediaType: PortfolioMediaType;
}
