import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { APIFY_UPWORK_JOBS_ACTOR_ID, API_ERROR_CODES } from '@constellation/shared';
import { codedNotFound } from '../../common/exceptions/coded-http.exception';
import { FREELANCER_PROFILE_ATTRS, SEARCH_FILTER_SET_ATTRS } from '../../database/attributes';
import { SearchFilterProvenance } from '../../database/enums';
import { FreelancerProfile } from '../../database/models/freelancer-profile.model';
import { SearchFilterSet } from '../../database/models/search-filter-set.model';
import { FilterAiClient } from './filter-ai.client';
import { OrgContextService } from './org-context.service';
import { UpdateSearchFiltersDto } from './dto/update-search-filters.dto';

@Injectable()
export class SearchFiltersService {
  constructor(
    @InjectModel(SearchFilterSet) private readonly filterModel: typeof SearchFilterSet,
    @InjectModel(FreelancerProfile) private readonly profileModel: typeof FreelancerProfile,
    private readonly orgContext: OrgContextService,
    private readonly filterAiClient: FilterAiClient,
  ) {}

  async getFilters(userId: string | undefined, profileId: string) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.requireOwnedProfile(orgId, profileId);

    const row = await this.filterModel.findOne({
      where: { orgId, freelancerProfileId: profileId },
      attributes: [...SEARCH_FILTER_SET_ATTRS],
    });
    if (!row) {
      return {
        filters: null,
        actorId: APIFY_UPWORK_JOBS_ACTOR_ID,
        freelancerProfileId: profileId,
      };
    }
    return this.toResponse(row);
  }

  async saveFilters(userId: string | undefined, profileId: string, dto: UpdateSearchFiltersDto) {
    const { userId: id, orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.requireOwnedProfile(orgId, profileId);

    const existing = await this.filterModel.findOne({
      where: { orgId, freelancerProfileId: profileId },
      attributes: [...SEARCH_FILTER_SET_ATTRS],
    });

    if (existing) {
      await existing.update({
        filters: dto.filters,
        provenance: SearchFilterProvenance.MANUAL,
        updatedByUserId: id,
        actorId: APIFY_UPWORK_JOBS_ACTOR_ID,
      });
      await existing.reload({ attributes: [...SEARCH_FILTER_SET_ATTRS] });
      return this.toResponse(existing);
    }

    const created = await this.filterModel.create({
      orgId,
      freelancerProfileId: profileId,
      actorId: APIFY_UPWORK_JOBS_ACTOR_ID,
      filters: dto.filters,
      provenance: SearchFilterProvenance.MANUAL,
      updatedByUserId: id,
    });
    await created.reload({ attributes: [...SEARCH_FILTER_SET_ATTRS] });
    return this.toResponse(created);
  }

  async generateFilters(userId: string | undefined, profileId: string) {
    const { userId: id, orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const profile = await this.requireOwnedProfile(orgId, profileId);

    const { filters } = await this.filterAiClient.generateFilters({
      profile: {
        title: profile.title,
        overview: profile.overview,
        skills: profile.skills,
        hourlyRateMin: profile.hourlyRateMin,
        hourlyRateMax: profile.hourlyRateMax,
        country: profile.country,
        timezone: profile.timezone,
        languages: profile.languages,
        exclusions: profile.exclusions,
      },
    });

    const existing = await this.filterModel.findOne({
      where: { orgId, freelancerProfileId: profileId },
      attributes: [...SEARCH_FILTER_SET_ATTRS],
    });

    if (existing) {
      await existing.update({
        filters,
        provenance: SearchFilterProvenance.AI,
        updatedByUserId: id,
        actorId: APIFY_UPWORK_JOBS_ACTOR_ID,
      });
      await existing.reload({ attributes: [...SEARCH_FILTER_SET_ATTRS] });
      return this.toResponse(existing);
    }

    const created = await this.filterModel.create({
      orgId,
      freelancerProfileId: profileId,
      actorId: APIFY_UPWORK_JOBS_ACTOR_ID,
      filters,
      provenance: SearchFilterProvenance.AI,
      updatedByUserId: id,
    });
    await created.reload({ attributes: [...SEARCH_FILTER_SET_ATTRS] });
    return this.toResponse(created);
  }

  private async requireOwnedProfile(orgId: string, profileId: string): Promise<FreelancerProfile> {
    const profile = await this.profileModel.findOne({
      where: { id: profileId, orgId },
      attributes: [...FREELANCER_PROFILE_ATTRS],
    });
    if (!profile) {
      throw codedNotFound(API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND);
    }
    return profile;
  }

  private toResponse(row: SearchFilterSet) {
    return {
      id: row.id,
      orgId: row.orgId,
      freelancerProfileId: row.freelancerProfileId,
      actorId: row.actorId,
      filters: row.filters,
      provenance: row.provenance,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
