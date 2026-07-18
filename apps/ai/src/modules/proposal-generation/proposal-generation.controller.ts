import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { ExtractStylePackResponse, GenerateProposalResponse } from '@constellation/shared';
import { InternalApiKeyGuard } from '../../common/guards/internal-api-key.guard';
import { ExtractStylePackDto } from './dto/extract-style-pack.dto';
import { GenerateProposalDto } from './dto/generate-proposal.dto';
import { ProposalGenerationService } from './proposal-generation.service';

@Controller('v1')
@UseGuards(InternalApiKeyGuard)
export class ProposalGenerationController {
  constructor(private readonly proposalGenerationService: ProposalGenerationService) {}

  @Post('generate-proposal')
  generateProposal(@Body() dto: GenerateProposalDto): Promise<GenerateProposalResponse> {
    return this.proposalGenerationService.generate({
      stylePack: dto.stylePack,
      profile: dto.profile,
      job: dto.job,
      examples: dto.examples,
    });
  }

  @Post('extract-style-pack')
  extractStylePack(@Body() dto: ExtractStylePackDto): Promise<ExtractStylePackResponse> {
    return this.proposalGenerationService.extractStylePack({ examples: dto.examples });
  }
}
