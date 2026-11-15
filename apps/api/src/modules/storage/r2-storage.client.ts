import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { AppConfig } from '../../config/configuration';

const UPLOAD_URL_TTL_SECONDS = 15 * 60;
const READ_URL_TTL_SECONDS = 15 * 60;

/**
 * TASK-P1-007/DES-P1-003: R2 is S3-compatible, so the AWS SDK v3 S3 client
 * talks to it directly. The API only ever issues a presigned PUT URL and
 * stores the resulting file_url - it never receives or proxies video bytes.
 *
 * ASM-P1-001: no real R2 bucket exists in this environment yet. R2_ENDPOINT
 * and R2_FORCE_PATH_STYLE are local-dev/test-only overrides (not part of
 * this plan's Settings table) so this same code can be pointed at a local
 * MinIO container; they default to R2's real endpoint shape in production.
 */
@Injectable()
export class R2StorageClient {
  private readonly logger = new Logger(R2StorageClient.name);
  private readonly s3: S3Client;
  private readonly bucketName: string;
  // M4: the presign/PUT endpoint (private R2 S3 API, credentials-gated) is
  // never the same URL the brand's browser fetches the finished video from
  // (the plan's own security guideline denies public reads on that
  // endpoint). fileUrl must be built from a real public/CDN domain.
  readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService<AppConfig>) {
    const r2 = this.configService.get('r2', { infer: true });
    const endpoint =
      process.env.R2_ENDPOINT ??
      `https://${r2?.accountId}.r2.cloudflarestorage.com`;

    this.bucketName = r2?.bucketName ?? '';
    this.s3 = new S3Client({
      region: 'auto',
      endpoint,
      forcePathStyle: process.env.R2_FORCE_PATH_STYLE === 'true',
      credentials: {
        accessKeyId: r2?.accessKeyId ?? '',
        secretAccessKey: r2?.secretAccessKey ?? '',
      },
    });

    const configuredPublicBaseUrl = this.configService.get('r2.publicBaseUrl', {
      infer: true,
    });
    if (configuredPublicBaseUrl) {
      this.publicBaseUrl = configuredPublicBaseUrl;
    } else {
      // ASM-P1-001: no real CDN/custom domain provisioned yet. Falls back
      // to the private endpoint so local/CI runs still produce a
      // structurally valid URL, but this is not a fetchable public URL and
      // must be set before this plan is verified against a real bucket.
      this.logger.warn(
        'R2_PUBLIC_BASE_URL is not configured; falling back to the private R2 endpoint for fileUrl, which the bucket policy will not serve publicly',
      );
      this.publicBaseUrl = `${endpoint}/${this.bucketName}`;
    }
  }

  /**
   * M2: the prefix a registered fileUrl must start with to be accepted as
   * belonging to this collaboration - an origin check, not a substring
   * check (deliverables.service.ts compares with startsWith, not
   * includes).
   */
  collaborationUrlPrefix(collaborationId: string): string {
    return `${this.publicBaseUrl}/collaborations/${collaborationId}/`;
  }

  /**
   * Generates a presigned URL for any generic module (e.g. portfolio, verification, products)
   */
  async createGenericUploadUrl(
    moduleName: string,
    contentType: string,
    extension: string,
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    const key = `${moduleName}/${randomUUID()}.${extension}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: UPLOAD_URL_TTL_SECONDS,
    });
    return { uploadUrl, fileUrl: `${this.publicBaseUrl}/${key}` };
  }

  /**
   * TASK-P1-007: object key namespaced collaborations/{id}/{uuid}.{ext};
   * TTL fixed at 15 minutes.
   */
  async createUploadUrl(
    collaborationId: string,
    contentType: string,
    extension: string,
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    const key = `collaborations/${collaborationId}/${randomUUID()}.${extension}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: UPLOAD_URL_TTL_SECONDS,
    });
    return { uploadUrl, fileUrl: `${this.publicBaseUrl}/${key}` };
  }

  /**
   * DES-P3-303 / SEC-303: a time limited GET URL for a deliverable object. The bucket
   * serves no public reads, so this is the only way a brand plays the video.
   */
  async createReadUrl(
    fileUrl: string,
    ttlSeconds = READ_URL_TTL_SECONDS,
  ): Promise<string> {
    if (!fileUrl.startsWith(`${this.publicBaseUrl}/`)) {
      throw new Error('fileUrl origin does not match publicBaseUrl');
    }
    const key = fileUrl.slice(`${this.publicBaseUrl}/`.length);
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return await getSignedUrl(this.s3, command, {
      expiresIn: ttlSeconds,
    });
  }
}
