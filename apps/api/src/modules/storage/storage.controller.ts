import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UserRole } from '../users/entities/user.entity';
import { R2StorageClient } from './r2-storage.client';
import { IsString, IsNumber, IsIn } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import { CollaborationsService } from '../collaborations/collaborations.service';
import { CollaborationStatus } from '../collaborations/entities/collaboration.entity';
import { Deliverable } from '../deliverables/entities/deliverable.entity';

export const ALLOWED_GENERIC_UPLOAD_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

export const ALLOWED_VIDEO_UPLOAD_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

const MODULE_MAX_BYTES: Record<string, number> = {
  brand_logo: 5 * 1024 * 1024,
  brand_document: 10 * 1024 * 1024,
};

export class RequestGenericUploadUrlDto {
  @IsString()
  @IsIn([
    'portfolio',
    'verification',
    'product',
    'deliverable',
    'brand_logo',
    'brand_document',
  ])
  module: string;

  @IsString()
  contentType: string;

  @IsNumber()
  fileSize: number;
}

export class RequestCollaborationUploadUrlDto {
  @IsString()
  contentType: string;

  @IsNumber()
  fileSize: number;
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
export class StorageController {
  constructor(
    private readonly r2StorageClient: R2StorageClient,
    private readonly configService: ConfigService,
    private readonly collaborationsService: CollaborationsService,
    @InjectRepository(Deliverable)
    private readonly deliverablesRepository: Repository<Deliverable>,
  ) {}

  @Post('storage/upload-url')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async requestUploadUrl(@Body() dto: RequestGenericUploadUrlDto) {
    const extension = ALLOWED_GENERIC_UPLOAD_TYPES[dto.contentType];
    if (!extension) {
      throw new BadRequestException('Unsupported content type');
    }

    if (
      dto.contentType === 'application/pdf' &&
      dto.module !== 'brand_document'
    ) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'content_type_not_allowed_for_module',
        'PDF uploads are only allowed for brand business documents',
      );
    }

    const moduleMaxBytes = MODULE_MAX_BYTES[dto.module];
    if (moduleMaxBytes !== undefined) {
      if (dto.fileSize > moduleMaxBytes) {
        const limitMb = moduleMaxBytes / (1024 * 1024);
        throw new BadRequestException(
          `File size exceeds ${limitMb}MB limit for module ${dto.module}`,
        );
      }
    } else {
      const maxFileSizeStr =
        this.configService.get<string>('MAX_UPLOAD_SIZE_MB') || '500';
      const maxFileSizeMB = parseInt(maxFileSizeStr, 10);
      if (dto.fileSize > maxFileSizeMB * 1024 * 1024) {
        throw new BadRequestException(
          `File size exceeds ${maxFileSizeMB}MB limit`,
        );
      }
    }

    const { uploadUrl, fileUrl } =
      await this.r2StorageClient.createGenericUploadUrl(
        dto.module,
        dto.contentType,
        extension,
      );

    return { data: { uploadUrl, fileUrl } };
  }

  /**
   * TASK-P3-04 / AUD-001:
   * POST /api/v1/collaborations/:id/deliverables/upload-url
   * Generates a presigned upload URL scoped to the collaboration.
   */
  @Post('collaborations/:id/deliverables/upload-url')
  @Roles(UserRole.CREATOR)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async requestCollaborationDeliverableUploadUrl(
    @CurrentUser() user: AuthUser,
    @Param('id') collaborationId: string,
    @Body() dto: RequestCollaborationUploadUrlDto,
  ) {
    const collaboration = await this.collaborationsService.findOwnedByCreator(
      user.userId,
      collaborationId,
    );

    const extension = ALLOWED_VIDEO_UPLOAD_TYPES[dto.contentType];
    if (!extension) {
      throw new BadRequestException('Unsupported video content type');
    }

    const maxFileSizeStr =
      this.configService.get<string>('MAX_UPLOAD_SIZE_MB') || '500';
    const maxFileSizeMB = parseInt(maxFileSizeStr, 10);
    if (dto.fileSize > maxFileSizeMB * 1024 * 1024) {
      throw new BadRequestException(
        `File size exceeds ${maxFileSizeMB}MB limit`,
      );
    }

    const isDigitalFunded =
      collaboration.status === CollaborationStatus.FUNDED &&
      collaboration.campaign?.needsShipping === false;

    if (
      collaboration.status !== CollaborationStatus.SHIPPED &&
      collaboration.status !== CollaborationStatus.REVISION_REQUESTED &&
      !isDigitalFunded
    ) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_state_transition',
        'Collaboration is not eligible for deliverable upload',
      );
    }

    const { uploadUrl, fileUrl } = await this.r2StorageClient.createUploadUrl(
      collaborationId,
      dto.contentType,
      extension,
    );

    return { data: { uploadUrl, fileUrl } };
  }

  /**
   * TASK-P3-04 / DES-P3-303 / SEC-303:
   * GET /api/v1/deliverables/:id/play-url
   * Generates a signed read URL with 15-minute expiration for video playback.
   */
  @Get('deliverables/:id/play-url')
  @Roles(UserRole.BRAND, UserRole.CREATOR)
  async getDeliverablePlayUrl(
    @CurrentUser() user: AuthUser,
    @Param('id') deliverableId: string,
  ) {
    const deliverable = await this.deliverablesRepository.findOne({
      where: { id: deliverableId },
      relations: { collaboration: true },
    });

    if (!deliverable) {
      throw new NotFoundException('Deliverable not found');
    }

    // Verify caller is a participant in this collaboration
    await this.collaborationsService.findOwnedByUser(
      user,
      deliverable.collaboration.id,
    );

    const expiresInSeconds = 900;
    const url = await this.r2StorageClient.createReadUrl(
      deliverable.fileUrl,
      expiresInSeconds,
    );

    return {
      data: {
        url,
        expiresInSeconds,
        // The web review screen opens from a direct link, so it needs the
        // parent collaboration without a second round trip.
        collaborationId: deliverable.collaboration.id,
        version: deliverable.version,
      },
    };
  }
}
