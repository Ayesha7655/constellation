import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  API_ERROR_CODES,
  PORTFOLIO_RELEVANCE_MAX_LENGTH,
  PROPOSAL_PORTFOLIO_RETRIEVAL_K,
  normalizeUpworkApifyFilters,
  type ExtractStylePackRequest,
  type ExtractStylePackResponse,
  type FindRelevantPortfolioRequest,
  type FindRelevantPortfolioResponse,
  type GenerateProposalRequest,
  type GenerateProposalResponse,
  type GenerateUpworkFiltersRequest,
  type GenerateUpworkFiltersResponse,
  type ProposalStylePreferences,
} from '@constellation/shared';
import { codedBadRequest } from '../../common/exceptions/coded-http.exception';

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asPreferences(raw: Record<string, unknown>): ProposalStylePreferences {
  return {
    tone: typeof raw.tone === 'string' ? raw.tone : null,
    lengthTarget: typeof raw.lengthTarget === 'string' ? raw.lengthTarget : null,
    structureNotes: typeof raw.structureNotes === 'string' ? raw.structureNotes : null,
    alwaysUse: Array.isArray(raw.alwaysUse)
      ? raw.alwaysUse.filter((item): item is string => typeof item === 'string')
      : [],
    neverUse: Array.isArray(raw.neverUse)
      ? raw.neverUse.filter((item): item is string => typeof item === 'string')
      : [],
    rateMentionPolicy: typeof raw.rateMentionPolicy === 'string' ? raw.rateMentionPolicy : null,
    ctaStyle: typeof raw.ctaStyle === 'string' ? raw.ctaStyle : null,
    extraNotes: typeof raw.extraNotes === 'string' ? raw.extraNotes : null,
  };
}

@Injectable()
export class AiServiceClient {
  constructor(private readonly configService: ConfigService) {}

  async generateFilters(body: GenerateUpworkFiltersRequest): Promise<GenerateUpworkFiltersResponse> {
    const { baseUrl, internalKey, timeoutMs } = this.resolveConfig();
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
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        codedBadRequest(API_ERROR_CODES.SEARCH_FILTERS_GENERATE_FAILED);
      }

      const data: unknown = await response.json();
      if (!isObjectRecord(data) || !isObjectRecord(data.filters)) {
        codedBadRequest(API_ERROR_CODES.SEARCH_FILTERS_GENERATE_FAILED);
      }

      const filters = normalizeUpworkApifyFilters(data.filters);
      if (filters.queries.length === 0) {
        codedBadRequest(API_ERROR_CODES.SEARCH_FILTERS_GENERATE_FAILED);
      }

      return { filters };
    } catch {
      codedBadRequest(API_ERROR_CODES.SEARCH_FILTERS_GENERATE_FAILED);
    }
  }

  async generateProposal(body: GenerateProposalRequest): Promise<GenerateProposalResponse> {
    const { baseUrl, internalKey, timeoutMs } = this.resolveConfig();
    if (!baseUrl || !internalKey) {
      codedBadRequest(API_ERROR_CODES.PROPOSAL_GENERATE_FAILED);
    }

    try {
      const response = await fetch(`${baseUrl}/v1/generate-proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': internalKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        codedBadRequest(API_ERROR_CODES.PROPOSAL_GENERATE_FAILED);
      }

      const data: unknown = await response.json();
      if (!isObjectRecord(data) || typeof data.body !== 'string' || !data.body.trim()) {
        codedBadRequest(API_ERROR_CODES.PROPOSAL_GENERATE_FAILED);
      }

      return { body: data.body.trim() };
    } catch {
      codedBadRequest(API_ERROR_CODES.PROPOSAL_GENERATE_FAILED);
    }
  }

  async findRelevantPortfolio(body: FindRelevantPortfolioRequest): Promise<FindRelevantPortfolioResponse> {
    const { baseUrl, internalKey, timeoutMs } = this.resolveConfig();
    if (!baseUrl || !internalKey) {
      codedBadRequest(API_ERROR_CODES.PROPOSAL_GENERATE_FAILED);
    }

    try {
      const response = await fetch(`${baseUrl}/v1/find-relevant-portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': internalKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        codedBadRequest(API_ERROR_CODES.PROPOSAL_GENERATE_FAILED);
      }

      const data: unknown = await response.json();
      if (!isObjectRecord(data) || !Array.isArray(data.matches)) {
        codedBadRequest(API_ERROR_CODES.PROPOSAL_GENERATE_FAILED);
      }
      if (data.matches.length > PROPOSAL_PORTFOLIO_RETRIEVAL_K) {
        codedBadRequest(API_ERROR_CODES.PROPOSAL_GENERATE_FAILED);
      }

      const matches = data.matches.map((value) => {
        if (!isObjectRecord(value)) {
          codedBadRequest(API_ERROR_CODES.PROPOSAL_GENERATE_FAILED);
        }
        const portfolioProjectId = value.portfolioProjectId;
        const relevance = value.relevance;
        if (
          typeof portfolioProjectId !== 'string' ||
          !portfolioProjectId.trim() ||
          typeof relevance !== 'string' ||
          !relevance.trim() ||
          relevance.trim().length > PORTFOLIO_RELEVANCE_MAX_LENGTH
        ) {
          codedBadRequest(API_ERROR_CODES.PROPOSAL_GENERATE_FAILED);
        }
        return {
          portfolioProjectId: portfolioProjectId.trim(),
          relevance: relevance.trim(),
        };
      });

      return { matches };
    } catch {
      codedBadRequest(API_ERROR_CODES.PROPOSAL_GENERATE_FAILED);
    }
  }

  async extractStylePack(body: ExtractStylePackRequest): Promise<ExtractStylePackResponse> {
    const { baseUrl, internalKey, timeoutMs } = this.resolveConfig();
    if (!baseUrl || !internalKey) {
      codedBadRequest(API_ERROR_CODES.PROPOSAL_STYLE_EXTRACT_FAILED);
    }

    try {
      const response = await fetch(`${baseUrl}/v1/extract-style-pack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': internalKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        codedBadRequest(API_ERROR_CODES.PROPOSAL_STYLE_EXTRACT_FAILED);
      }

      const data: unknown = await response.json();
      if (!isObjectRecord(data) || !isObjectRecord(data.preferences)) {
        codedBadRequest(API_ERROR_CODES.PROPOSAL_STYLE_EXTRACT_FAILED);
      }

      return { preferences: asPreferences(data.preferences) };
    } catch {
      codedBadRequest(API_ERROR_CODES.PROPOSAL_STYLE_EXTRACT_FAILED);
    }
  }

  private resolveConfig(): { baseUrl: string | undefined; internalKey: string | undefined; timeoutMs: number } {
    const baseUrl = this.configService.get<string>('AI_SERVICE_URL')?.trim().replace(/\/$/, '');
    const internalKey = this.configService.get<string>('AI_SERVICE_INTERNAL_KEY')?.trim();
    const timeoutRaw = Number(this.configService.get<string>('AI_SERVICE_TIMEOUT_MS') ?? '15000');
    const timeoutMs = Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? timeoutRaw : 15000;
    return { baseUrl, internalKey, timeoutMs };
  }
}
