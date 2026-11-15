import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Language } from '../../../common/enums/language.enum';

/** REQ-007, TASK-W4-05: creator browse filters with search, multi-niche, duration, and sort. */
export class QueryCampaignDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  q?: string;

  /** Single niche or comma-separated list of up to 6 niches */
  @IsOptional()
  @IsString()
  niche?: string;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBudget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxBudget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minDuration?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxDuration?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  needsShipping?: boolean;

  @IsOptional()
  @IsString()
  sort?: string = 'newest';
}
