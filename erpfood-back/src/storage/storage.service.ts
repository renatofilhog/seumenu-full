import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { GetObjectResult, UploadObjectInput, UploadObjectResult } from './storage.types';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly defaultBucket: string;
  private readonly presignExpSeconds: number;
  private readonly publicRead: boolean;
  private readonly forcePathStyle: boolean;
  private readonly endpoint?: string;
  private readonly publicBaseUrl?: string;
  private readonly autoCreateBucket: boolean;

  constructor() {
    this.defaultBucket = process.env.S3_BUCKET ?? 'uploads';
    this.presignExpSeconds = Number(process.env.S3_PRESIGN_EXP_SECONDS ?? '300');
    this.publicRead = (process.env.S3_PUBLIC_READ ?? 'false') === 'true';
    this.forcePathStyle = (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true';
    this.endpoint = process.env.S3_ENDPOINT?.trim() || undefined;
    this.publicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.trim() || this.endpoint;
    this.autoCreateBucket = (process.env.S3_AUTO_CREATE_BUCKET ?? 'true') === 'true';

    this.client = new S3Client({
      region: process.env.S3_REGION ?? 'us-east-1',
      endpoint: this.endpoint,
      forcePathStyle: this.forcePathStyle,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY ?? '',
        secretAccessKey: process.env.S3_SECRET_KEY ?? '',
      },
    });
  }

  async onModuleInit() {
    if (!this.autoCreateBucket) {
      return;
    }
    await this.ensureBucketExists(this.defaultBucket);
  }

  getDefaultBucket() {
    return this.defaultBucket;
  }

  isPublicReadEnabled() {
    return this.publicRead;
  }

  async ensureBucketExists(bucket: string) {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
      return;
    } catch {
      this.logger.warn(`Bucket ${bucket} not found. Attempting to create it.`);
    }

    try {
      await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
      this.logger.log(`Bucket ${bucket} created successfully.`);
    } catch (error) {
      this.logger.error(`Failed to create bucket ${bucket}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async uploadObject(input: UploadObjectInput): Promise<UploadObjectResult> {
    const command = new PutObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    });

    try {
      const result = await this.client.send(command);
      return {
        bucket: input.bucket,
        key: input.key,
        etag: result.ETag?.replaceAll('"', ''),
        size: input.body.byteLength,
        contentType: input.contentType,
      };
    } catch (error) {
      this.logger.error(`Upload failed for ${input.bucket}/${input.key}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async deleteObject(bucket: string, key: string) {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch (error) {
      this.logger.error(`Delete failed for ${bucket}/${key}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async getObject(bucket: string, key: string): Promise<GetObjectResult> {
    const response = await this.client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = response.Body;
    if (!(body instanceof Readable)) {
      throw new Error('Storage object stream is unavailable.');
    }

    return {
      stream: body,
      contentLength: response.ContentLength,
      contentType: response.ContentType,
      etag: response.ETag?.replaceAll('"', ''),
    };
  }

  getPublicUrl(bucket: string, key: string): string {
    const keyWithoutLeadingSlash = key.replace(/^\/+/, '');

    if (!this.publicBaseUrl) {
      const region = process.env.S3_REGION ?? 'us-east-1';
      if (this.forcePathStyle) {
        return `https://s3.${region}.amazonaws.com/${bucket}/${keyWithoutLeadingSlash}`;
      }
      return `https://${bucket}.s3.${region}.amazonaws.com/${keyWithoutLeadingSlash}`;
    }

    const normalizedBase = this.publicBaseUrl.replace(/\/+$/, '');

    if (this.publicBaseUrlAlreadyContainsBucket(normalizedBase, bucket)) {
      return `${normalizedBase}/${keyWithoutLeadingSlash}`;
    }

    if (this.forcePathStyle) {
      return `${normalizedBase}/${bucket}/${keyWithoutLeadingSlash}`;
    }

    if (/^https?:\/\//i.test(normalizedBase)) {
      return `${normalizedBase}/${keyWithoutLeadingSlash}`;
    }

    return `https://${bucket}.${normalizedBase}/${keyWithoutLeadingSlash}`;
  }

  private publicBaseUrlAlreadyContainsBucket(baseUrl: string, bucket: string): boolean {
    try {
      const parsed = new URL(baseUrl);
      const host = parsed.host.toLowerCase();
      const pathname = parsed.pathname.replace(/\/+$/, '');

      if (host === bucket.toLowerCase()) {
        return true;
      }

      if (host.startsWith(`${bucket.toLowerCase()}.`)) {
        return true;
      }

      return pathname === `/${bucket}` || pathname.startsWith(`/${bucket}/`);
    } catch {
      return false;
    }
  }

  async getPresignedUrl(bucket: string, key: string, expiresIn?: number) {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this.client, command, {
      expiresIn: expiresIn ?? this.presignExpSeconds,
    });
  }
}
