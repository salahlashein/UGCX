import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Niche } from '../../../common/enums/niche.enum';
import { Language } from '../../../common/enums/language.enum';
import { ScriptMode, VideoType } from '../entities/campaign.entity';

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(140)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  brief?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(100)
  budgetMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(100)
  @Max(1000000)
  budgetMax?: number;

  @IsOptional()
  @IsISO8601()
  closesAt?: string;

  @IsOptional()
  @IsEnum(Niche)
  niche?: Niche;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsEnum(VideoType)
  videoType?: VideoType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(600)
  durationSeconds?: number;

  @IsOptional()
  @IsEnum(ScriptMode)
  scriptMode?: ScriptMode;

  @IsOptional()
  @IsString()
  script?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  talkingPoints?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  doNotSay?: string[];

  @IsOptional()
  @IsBoolean()
  needsShipping?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  slots?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5)
  revisionLimit?: number;
}
