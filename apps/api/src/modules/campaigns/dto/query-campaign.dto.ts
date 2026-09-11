import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Niche } from '../../../common/enums/niche.enum';
import { Language } from '../../../common/enums/language.enum';

/** REQ-007: creator browse filters, on top of the shared pagination params. */
export class QueryCampaignDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(Niche)
  niche?: Niche;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;
}
