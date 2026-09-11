import {
  Controller,
  Post,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { R2StorageClient } from './r2-storage.client';
import { IsString, IsNumber, IsIn } from 'class-validator';

import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

export const ALLOWED_GENERIC_UPLOAD_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export class RequestGenericUploadUrlDto {
  @IsString()
  @IsIn(['portfolio', 'verification', 'product', 'deliverable'])
  module: string;

  @IsString()
  contentType: string;

  @IsNumber()
  fileSize: number;
}

@Controller('storage')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class StorageController {
  constructor(
    private readonly r2StorageClient: R2StorageClient,
    private readonly configService: ConfigService,
  ) {}

  @Post('upload-url')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async requestUploadUrl(@Body() dto: RequestGenericUploadUrlDto) {
    const extension = ALLOWED_GENERIC_UPLOAD_TYPES[dto.contentType];
    if (!extension) {
      throw new BadRequestException('Unsupported content type');
    }

    // Default to 500MB if not configured
    const maxFileSizeStr =
      this.configService.get<string>('MAX_UPLOAD_SIZE_MB') || '500';
    const maxFileSizeMB = parseInt(maxFileSizeStr, 10);

    if (dto.fileSize > maxFileSizeMB * 1024 * 1024) {
      throw new BadRequestException(
        `File size exceeds ${maxFileSizeMB}MB limit`,
      );
    }

    const { uploadUrl, fileUrl } =
      await this.r2StorageClient.createGenericUploadUrl(
        dto.module,
        dto.contentType,
        extension,
      );

    return { data: { uploadUrl, fileUrl } };
  }
}
