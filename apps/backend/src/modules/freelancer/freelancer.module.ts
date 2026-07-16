import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';
import { ApifyClient } from './apify.client';
import { ExtensionPairingController, ExtensionPublicController } from './extension-pairing.controller';
import { ExtensionPairingService } from './extension-pairing.service';
import { FilterAiClient } from './filter-ai.client';
import { FreelancerProfileController } from './freelancer-profile.controller';
import { FreelancerProfileService } from './freelancer-profile.service';
import { OrgContextService } from './org-context.service';
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

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    FreelancerProfileController,
    SearchFiltersController,
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
    ScrapeRunsService,
    UpworkJobsService,
    UpworkOverviewService,
    UpworkScoringService,
    ExtensionPairingService,
    FilterAiClient,
    ApifyClient,
  ],
})
export class FreelancerModule {}
