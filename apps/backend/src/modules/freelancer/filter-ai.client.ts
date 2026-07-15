import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { API_ERROR_CODES, type GenerateUpworkFiltersRequest } from '@constellation/shared';
import type { GenerateUpworkFiltersResponse } from '@constellation/shared';
import { codedBadRequest } from '../../common/exceptions/coded-http.exception';

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class FilterAiClient {
  constructor(private readonly configService: ConfigService) {}

  async generateFilters(body: GenerateUpworkFiltersRequest): Promise<GenerateUpworkFiltersResponse> {
    const baseUrl = this.configService.get<string>('FILTER_AI_URL')?.trim().replace(/\/$/, '');
    const internalKey = this.configService.get<string>('FILTER_AI_INTERNAL_KEY')?.trim();
    const timeoutMs = Number(this.configService.get<string>('FILTER_AI_TIMEOUT_MS') ?? '15000');
    if (!baseUrl || !internalKey) {
      codedBadRequest(API_ERROR_CODES.SEARCH_FILTERS_GENERATE_FAILED);
    }

    try {
      const response = await fetch(`${baseUrl}/v1/generate-filters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': internalKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15000),
      });

      if (!response.ok) {
        codedBadRequest(API_ERROR_CODES.SEARCH_FILTERS_GENERATE_FAILED);
      }

      const data: unknown = await response.json();
      if (!isObjectRecord(data) || !isObjectRecord(data.filters)) {
        codedBadRequest(API_ERROR_CODES.SEARCH_FILTERS_GENERATE_FAILED);
      }
      return { filters: data.filters };
    } catch {
      codedBadRequest(API_ERROR_CODES.SEARCH_FILTERS_GENERATE_FAILED);
    }
  }
}
