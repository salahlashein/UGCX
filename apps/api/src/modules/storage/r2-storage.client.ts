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
 * Upload modules whose files anyone may see, so they go to the public
 * assets bucket. Everything else (deliverables, verification clips,
 * business documents) stays in the private bucket and is only read through
 * a short-lived signed URL.
 */
export const PUBLIC_UPLOAD_MODULES = new Set([
  'brand_logo',
  'portfolio',
  'product',
]);

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
  //
  // With the private bucket's r2.dev access turned off, this is only the
  // prefix stored on private file URLs (createReadUrl strips it to find the
  // object key); it no longer serves the file to anyone.
  readonly publicBaseUrl: string;
  // The public assets bucket and the base URL its files are served from.
  // Both fall back to the private bucket when R2_ASSETS_* is not set.
  private readonly assetsBucketName: string;
  readonly assetsBaseUrl: string;

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

    const assetsBucket = r2?.assetsBucketName;
    const assetsBase = r2?.assetsPublicBaseUrl;
    if (assetsBucket && assetsBase) {
      this.assetsBucketName = assetsBucket;
      this.assetsBaseUrl = assetsBase.replace(/\/+$/, '');
    } else {
      if (assetsBucket || assetsBase) {
        this.logger.warn(
          'R2_ASSETS_BUCKET_NAME and R2_ASSETS_PUBLIC_BASE_URL must be set together; public assets use the private bucket',
        );
      }
      this.assetsBucketName = this.bucketName;
      this.assetsBaseUrl = this.publicBaseUrl;
    }
  }

  /** True when a URL points into the public assets bucket. */
  isAssetUrl(url: string): boolean {
    return url.startsWith(`${this.assetsBaseUrl}/`);
  }

  /** True when a URL points into the private bucket. */
  isPrivateFileUrl(url: string): boolean {
    return url.startsWith(`${this.publicBaseUrl}/`);
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
    const isPublic = PUBLIC_UPLOAD_MODULES.has(moduleName);
    const key = `${moduleName}/${randomUUID()}.${extension}`;
    const command = new PutObjectCommand({
      Bucket: isPublic ? this.assetsBucketName : this.bucketName,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: UPLOAD_URL_TTL_SECONDS,
    });
    const base = isPublic ? this.assetsBaseUrl : this.publicBaseUrl;
    return { uploadUrl, fileUrl: `${base}/${key}` };
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
