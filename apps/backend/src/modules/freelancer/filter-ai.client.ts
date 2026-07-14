import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { API_ERROR_CODES } from '@constellation/shared';
import { codedBadRequest } from '../../common/exceptions/coded-http.exception';

type GenerateFiltersRequest = {
  profile: Record<string, unknown>;
};

type GenerateFiltersResponse = {
  filters: Record<string, unknown>;
};

@Injectable()
export class FilterAiClient {
  constructor(private readonly configService: ConfigService) {}

  async generateFilters(body: GenerateFiltersRequest): Promise<GenerateFiltersResponse> {
    const baseUrl = this.configService.get<string>('FILTER_AI_URL')?.replace(/\/$/, '');
    const internalKey = this.configService.get<string>('FILTER_AI_INTERNAL_KEY');
    if (!baseUrl || !internalKey) {
      codedBadRequest(API_ERROR_CODES.SEARCH_FILTERS_GENERATE_FAILED);
    }

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/v1/generate-filters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': internalKey,
        },
        body: JSON.stringify(body),
      });
    } catch {
      codedBadRequest(API_ERROR_CODES.SEARCH_FILTERS_GENERATE_FAILED);
    }

    if (!response.ok) {
      codedBadRequest(API_ERROR_CODES.SEARCH_FILTERS_GENERATE_FAILED);
    }

    const data = (await response.json()) as GenerateFiltersResponse;
    if (!data?.filters || typeof data.filters !== 'object') {
      codedBadRequest(API_ERROR_CODES.SEARCH_FILTERS_GENERATE_FAILED);
    }
    return data;
  }
}
