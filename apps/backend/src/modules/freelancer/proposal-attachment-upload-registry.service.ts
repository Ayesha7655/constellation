import { Injectable } from '@nestjs/common';
import { API_ERROR_CODES } from '@constellation/shared';
import { codedBadRequest } from '../../common/exceptions/coded-http.exception';

const REGISTRY_TTL_MS = 24 * 60 * 60 * 1000;

type UploadRegistryEntry = Readonly<{
  key: string;
  userId: string;
  orgId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  registeredAt: number;
}>;

@Injectable()
export class ProposalAttachmentUploadRegistry {
  private readonly entries = new Map<string, UploadRegistryEntry>();

  registerUpload(entry: Omit<UploadRegistryEntry, 'registeredAt'>): void {
    this.purgeExpired();
    this.entries.set(entry.key, { ...entry, registeredAt: Date.now() });
  }

  assertKeyForUser(userId: string, orgId: string, key: string): UploadRegistryEntry {
    this.purgeExpired();
    const entry = this.entries.get(key);
    if (!entry || entry.userId !== userId || entry.orgId !== orgId) {
      throw codedBadRequest(API_ERROR_CODES.PROPOSAL_ATTACHMENT_INVALID);
    }
    return entry;
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
    const cutoff = Date.now() - REGISTRY_TTL_MS;
    for (const [key, entry] of this.entries.entries()) {
      if (entry.registeredAt < cutoff) {
        this.entries.delete(key);
      }
    }
  }
}
