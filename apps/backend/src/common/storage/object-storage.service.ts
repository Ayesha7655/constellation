import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';

/**
 * Object storage for app uploads.
 * - When `S3_BUCKET` is set → AWS S3
 * - Otherwise → local disk under `UPLOAD_LOCAL_DIR` (default `.data/uploads`)
 */
@Injectable()
export class ObjectStorageService {
  private readonly logger = new Logger(ObjectStorageService.name);
  private readonly s3Client: S3Client | null;
  private readonly bucket: string | null;
  private readonly localRoot: string;

  constructor(private readonly configService: ConfigService) {
    const bucket = this.configService.get<string>('S3_BUCKET')?.trim() || null;
    this.bucket = bucket;
    this.s3Client = bucket
      ? new S3Client({
          region: this.configService.get<string>('S3_REGION')?.trim() || 'us-east-1',
          credentials: this.resolveCredentials(),
        })
      : null;
    const configuredRoot = this.configService.get<string>('UPLOAD_LOCAL_DIR')?.trim();
    this.localRoot = resolve(configuredRoot || join(process.cwd(), '.data', 'uploads'));
  }

  async putObject(storageKey: string, body: Buffer, mimeType: string): Promise<void> {
    if (this.s3Client && this.bucket) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
          Body: body,
          ContentType: mimeType,
        }),
      );
      return;
    }

    const absolutePath = this.resolveLocalPath(storageKey);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, body);
  }

  async deleteObject(storageKey: string): Promise<void> {
    try {
      if (this.s3Client && this.bucket) {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: storageKey,
          }),
        );
        return;
      }

      const absolutePath = this.resolveLocalPath(storageKey);
      await unlink(absolutePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown delete error';
      this.logger.warn(`Failed to delete object ${storageKey}: ${message}`);
    }
  }

  private resolveCredentials():
    | { accessKeyId: string; secretAccessKey: string }
    | undefined {
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID')?.trim();
    const secretAccessKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY')?.trim();
    if (accessKeyId && secretAccessKey) {
      return { accessKeyId, secretAccessKey };
    }
    return undefined;
  }

  private resolveLocalPath(storageKey: string): string {
    const normalized = storageKey.replace(/\\/g, '/').replace(/^\/+/, '');
    if (normalized.includes('..') || normalized.includes('\0')) {
      throw new Error('Invalid storage key path');
    }
    const absolutePath = resolve(this.localRoot, ...normalized.split('/'));
    const rootWithSep = this.localRoot.endsWith(sep) ? this.localRoot : `${this.localRoot}${sep}`;
    if (absolutePath !== this.localRoot && !absolutePath.startsWith(rootWithSep)) {
      throw new Error('Storage path escaped upload root');
    }
    return absolutePath;
  }
}
