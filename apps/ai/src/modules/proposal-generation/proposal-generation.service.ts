import { Injectable, Logger } from '@nestjs/common';
import type {
  ExtractStylePackRequest,
  ExtractStylePackResponse,
  GenerateProposalRequest,
  GenerateProposalResponse,
} from '@constellation/shared';
import { buildFallbackProposal } from './fallbacks/build-fallback-proposal';
import { buildFallbackStylePack } from './fallbacks/build-fallback-style-pack';
import { OpenAiProposalProvider } from './providers/openai-proposal.provider';

@Injectable()
export class ProposalGenerationService {
  private readonly logger = new Logger(ProposalGenerationService.name);

  constructor(private readonly openAiProposalProvider: OpenAiProposalProvider) {}

  async generate(input: GenerateProposalRequest): Promise<GenerateProposalResponse> {
    if (!this.openAiProposalProvider.isConfigured()) {
      this.logger.warn('OPENAI_API_KEY is not configured; using deterministic fallback proposal');
      return { body: buildFallbackProposal(input) };
    }

    const generated = await this.openAiProposalProvider.generate(input);
    return { body: generated ?? buildFallbackProposal(input) };
  }

  async extractStylePack(input: ExtractStylePackRequest): Promise<ExtractStylePackResponse> {
    if (!this.openAiProposalProvider.isConfigured()) {
      this.logger.warn('OPENAI_API_KEY is not configured; using deterministic fallback style pack');
      return { preferences: buildFallbackStylePack(input) };
    }

    const extracted = await this.openAiProposalProvider.extractStylePack(input);
    return { preferences: extracted ?? buildFallbackStylePack(input) };
  }
}
