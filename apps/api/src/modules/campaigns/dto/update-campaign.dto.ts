import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Niche } from '../../../common/enums/niche.enum';
import { Language } from '../../../common/enums/language.enum';
import { ScriptMode, VideoType } from '../entities/campaign.entity';

export class UpdateCampaignDto {
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
  @IsInt()
  @Min(1)
  @Max(50)
  slots?: number;
}
