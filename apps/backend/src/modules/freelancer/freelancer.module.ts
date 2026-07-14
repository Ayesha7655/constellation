import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';
import { ExtensionPairingController, ExtensionPublicController } from './extension-pairing.controller';
import { ExtensionPairingService } from './extension-pairing.service';
import { FilterAiClient } from './filter-ai.client';
import { FreelancerProfileController } from './freelancer-profile.controller';
import { FreelancerProfileService } from './freelancer-profile.service';
import { OrgContextService } from './org-context.service';
import { SearchFiltersController } from './search-filters.controller';
import { SearchFiltersService } from './search-filters.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    FreelancerProfileController,
    SearchFiltersController,
    ExtensionPairingController,
    ExtensionPublicController,
  ],
  providers: [
    OrgContextService,
    FreelancerProfileService,
    SearchFiltersService,
    ExtensionPairingService,
    FilterAiClient,
  ],
})
export class FreelancerModule {}
