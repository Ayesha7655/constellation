import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';
import { ApifyClient } from './apify.client';
import { ExtensionPairingController, ExtensionPublicController } from './extension-pairing.controller';
import { ExtensionPairingService } from './extension-pairing.service';
import { AiServiceClient } from './ai-service.client';
import { FreelancerProfileController } from './freelancer-profile.controller';
import { FreelancerProfileService } from './freelancer-profile.service';
import { OrgContextService } from './org-context.service';
import { ProposalDraftsController } from './proposal-drafts.controller';
import { ProposalDraftFromJobUrlController } from './proposal-draft-from-job-url.controller';
import { ProposalExamplesController } from './proposal-examples.controller';
import { ProposalAttachmentsController } from './proposal-attachments.controller';
import { ProposalStylePackController } from './proposal-style-pack.controller';
import { ProposalsService } from './proposals.service';
import { ProposalAttachmentUploadRegistry } from './proposal-attachment-upload-registry.service';
import { ObjectStorageService } from '../../common/storage/object-storage.service';
import { ScrapeRunsController } from './scrape-runs.controller';
import { ScrapeRunsService } from './scrape-runs.service';
import { SearchFiltersController } from './search-filters.controller';
import { SearchFiltersService } from './search-filters.service';
import { UpworkJobsController } from './upwork-jobs.controller';
import { UpworkJobsService } from './upwork-jobs.service';
import { UpworkOverviewController } from './upwork-overview.controller';
import { UpworkOverviewService } from './upwork-overview.service';
import { UpworkScoringController } from './upwork-scoring.controller';
import { UpworkScoringService } from './upwork-scoring.service';
import { PortfolioProjectsController } from './portfolio-projects.controller';
import { PortfolioProjectsService } from './portfolio-projects.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    FreelancerProfileController,
    SearchFiltersController,
    ProposalStylePackController,
    ProposalExamplesController,
    ProposalDraftsController,
    ProposalDraftFromJobUrlController,
    ProposalAttachmentsController,
    PortfolioProjectsController,
    ScrapeRunsController,
    UpworkJobsController,
    UpworkOverviewController,
    UpworkScoringController,
    ExtensionPairingController,
    ExtensionPublicController,
  ],
  providers: [
    OrgContextService,
    FreelancerProfileService,
    SearchFiltersService,
    ProposalsService,
    ProposalAttachmentUploadRegistry,
    ObjectStorageService,
    PortfolioProjectsService,
    ScrapeRunsService,
    UpworkJobsService,
    UpworkOverviewService,
    UpworkScoringService,
    ExtensionPairingService,
    AiServiceClient,
    ApifyClient,
  ],
})
export class FreelancerModule {}
