import { Module } from '@nestjs/common';
import { InternalApiKeyGuard } from '../../common/guards/internal-api-key.guard';
import { ProposalGenerationController } from './proposal-generation.controller';
import { ProposalGenerationService } from './proposal-generation.service';
import { OpenAiProposalProvider } from './providers/openai-proposal.provider';

@Module({
  controllers: [ProposalGenerationController],
  providers: [InternalApiKeyGuard, ProposalGenerationService, OpenAiProposalProvider],
})
export class ProposalGenerationModule {}
