import { BadRequestException, Injectable } from '@nestjs/common';
import { PROFILE_PHOTO_UPLOAD_REGISTRY_TTL_MS } from './constants/profile.constants';

type UploadRegistryEntry = Readonly<{
  key: string;
  userId: string;
  mimeType: string;
  sizeBytes: number;
  registeredAt: number;
}>;

@Injectable()
export class ProfilePhotoUploadRegistryService {
  private readonly entries = new Map<string, UploadRegistryEntry>();

  registerUpload(userId: string, key: string, mimeType: string, sizeBytes: number): void {
    this.purgeExpired();
    this.entries.set(key, {
      key,
      userId,
      mimeType,
      sizeBytes,
      registeredAt: Date.now(),
    });
  }

  assertKeyRegisteredForUser(userId: string, key: string): void {
    this.purgeExpired();
    const entry = this.entries.get(key);
    if (!entry || entry.userId !== userId) {
      throw new BadRequestException('Invalid or expired profile photo upload');
    }
  }

  consumeKey(userId: string, key: string): void {
    const entry = this.entries.get(key);
    if (entry?.userId === userId) {
      this.entries.delete(key);
    }
  }

  releaseKey(userId: string, key: string): void {
    this.consumeKey(userId, key);
  }

  private purgeExpired(): void {
    const cutoff = Date.now() - PROFILE_PHOTO_UPLOAD_REGISTRY_TTL_MS;
    for (const [key, entry] of this.entries.entries()) {
      if (entry.registeredAt < cutoff) {
        this.entries.delete(key);
      }
    }
  }
}
