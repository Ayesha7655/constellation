import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { API_ERROR_CODES } from '@constellation/shared';
import { Op } from 'sequelize';
import { codedNotFound } from '../../common/exceptions/coded-http.exception';
import { sanitizeJsonRecord } from '../../common/utils/json-unicode';
import {
  FREELANCER_PROFILE_ATTRS,
  PROFILE_IMPORT_DRAFT_ATTRS,
} from '../../database/attributes';
import { FreelancerProfileSource } from '../../database/enums';
import { FreelancerProfile } from '../../database/models/freelancer-profile.model';
import { ProfileImportDraft } from '../../database/models/profile-import-draft.model';
import { SearchFilterSet } from '../../database/models/search-filter-set.model';
import type { CreateFreelancerProfileDto } from './dto/create-freelancer-profile.dto';
import type { ConfirmImportDto } from './dto/confirm-import.dto';
import type { ImportFreelancerProfileDto } from './dto/import-freelancer-profile.dto';
import type { UpdateFreelancerProfileDto } from './dto/update-freelancer-profile.dto';
import { OrgContextService } from './org-context.service';
import type {
  FreelancerProfileResult,
  FreelancerProfilesListResult,
  FreelancerProfileView,
  ImportDraftResult,
  PendingDraftView,
} from './types/freelancer-profile.types';

const DRAFT_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class FreelancerProfileService {
  constructor(
    @InjectModel(FreelancerProfile) private readonly profileModel: typeof FreelancerProfile,
    @InjectModel(ProfileImportDraft) private readonly draftModel: typeof ProfileImportDraft,
    @InjectModel(SearchFilterSet) private readonly filterSetModel: typeof SearchFilterSet,
    private readonly orgContext: OrgContextService,
  ) {}

  async listProfiles(userId: string | undefined): Promise<FreelancerProfilesListResult> {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.purgeExpiredDrafts(orgId);

    const [profiles, draft] = await Promise.all([
      this.profileModel.findAll({
        where: { orgId },
        attributes: [...FREELANCER_PROFILE_ATTRS],
        order: [['createdAt', 'DESC']],
      }),
      this.draftModel.findOne({
        where: { orgId, expiresAt: { [Op.gt]: new Date() } },
        attributes: [...PROFILE_IMPORT_DRAFT_ATTRS],
      }),
    ]);

    return {
      profiles: profiles.map((row) => this.toProfileView(row)),
      pendingDraft: draft ? this.toDraftView(draft) : null,
    };
  }

  async getProfile(userId: string | undefined, profileId: string): Promise<FreelancerProfileResult> {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const profile = await this.findOwnedProfile(orgId, profileId);
    return { profile: this.toProfileView(profile) };
  }

  async createProfile(
    userId: string | undefined,
    dto: CreateFreelancerProfileDto,
  ): Promise<FreelancerProfileResult> {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const profile = await this.profileModel.create({
      orgId,
      label: dto.label?.trim() || null,
      title: dto.title?.trim() || null,
      overview: dto.overview?.trim() || null,
      skills: dto.skills ?? [],
      hourlyRateMin: dto.hourlyRateMin ?? null,
      hourlyRateMax: dto.hourlyRateMax ?? null,
      country: dto.country?.trim() || null,
      timezone: dto.timezone?.trim() || null,
      languages: dto.languages ?? [],
      exclusions: dto.exclusions ?? [],
      profileUrl: dto.profileUrl?.trim() || null,
      source: FreelancerProfileSource.MANUAL,
      rawSnapshot: null,
    });
    const created = await this.profileModel.findByPk(profile.id, {
      attributes: [...FREELANCER_PROFILE_ATTRS],
    });
    if (!created) {
      throw codedNotFound(API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND);
    }
    return { profile: this.toProfileView(created) };
  }

  async updateProfile(
    userId: string | undefined,
    profileId: string,
    dto: UpdateFreelancerProfileDto,
  ): Promise<FreelancerProfileResult> {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const profile = await this.findOwnedProfile(orgId, profileId);

    await profile.update({
      label: dto.label !== undefined ? dto.label?.trim() || null : profile.label,
      title: dto.title !== undefined ? dto.title.trim() : profile.title,
      overview: dto.overview !== undefined ? dto.overview.trim() : profile.overview,
      skills: dto.skills ?? profile.skills,
      hourlyRateMin: dto.hourlyRateMin !== undefined ? dto.hourlyRateMin : profile.hourlyRateMin,
      hourlyRateMax: dto.hourlyRateMax !== undefined ? dto.hourlyRateMax : profile.hourlyRateMax,
      country: dto.country !== undefined ? dto.country.trim() : profile.country,
      timezone: dto.timezone !== undefined ? dto.timezone.trim() : profile.timezone,
      languages: dto.languages ?? profile.languages,
      exclusions: dto.exclusions ?? profile.exclusions,
      profileUrl: dto.profileUrl !== undefined ? dto.profileUrl.trim() : profile.profileUrl,
      source: FreelancerProfileSource.MANUAL,
    });

    const refreshed = await this.profileModel.findByPk(profile.id, {
      attributes: [...FREELANCER_PROFILE_ATTRS],
    });
    if (!refreshed) {
      throw codedNotFound(API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND);
    }
    return { profile: this.toProfileView(refreshed) };
  }

  async deleteProfile(userId: string | undefined, profileId: string): Promise<{ ok: true }> {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const profile = await this.findOwnedProfile(orgId, profileId);
    await this.filterSetModel.destroy({ where: { freelancerProfileId: profile.id } });
    await profile.destroy();
    return { ok: true };
  }

  async importDraft(
    userId: string | undefined,
    dto: ImportFreelancerProfileDto,
  ): Promise<ImportDraftResult> {
    const { orgId, userId: actorId } = await this.orgContext.requireOrgIdForUser(userId);
    const expiresAt = new Date(Date.now() + DRAFT_TTL_MS);
    const payload = sanitizeJsonRecord({
      title: dto.title ?? null,
      overview: dto.overview ?? null,
      skills: dto.skills ?? [],
      hourlyRateMin: dto.hourlyRateMin ?? null,
      hourlyRateMax: dto.hourlyRateMax ?? null,
      country: dto.country ?? null,
      timezone: dto.timezone ?? null,
      languages: dto.languages ?? [],
      profileUrl: dto.profileUrl ?? null,
      rawSnapshot: dto.rawSnapshot ?? null,
    });

    const existing = await this.draftModel.findOne({
      where: { orgId },
      attributes: [...PROFILE_IMPORT_DRAFT_ATTRS],
    });

    if (existing) {
      await existing.update({ payload, expiresAt, createdByUserId: actorId });
      return { draft: this.toDraftView(existing) };
    }

    const created = await this.draftModel.create({
      orgId,
      createdByUserId: actorId,
      payload,
      expiresAt,
    });
    return { draft: this.toDraftView(created) };
  }

  async confirmImport(
    userId: string | undefined,
    dto: ConfirmImportDto = {},
  ): Promise<FreelancerProfileResult> {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.purgeExpiredDrafts(orgId);

    const draft = await this.draftModel.findOne({
      where: { orgId, expiresAt: { [Op.gt]: new Date() } },
      attributes: [...PROFILE_IMPORT_DRAFT_ATTRS],
    });
    if (!draft) {
      throw codedNotFound(API_ERROR_CODES.FREELANCER_PROFILE_DRAFT_NOT_FOUND);
    }

    const payload = draft.payload;
    const draftTitle = typeof payload.title === 'string' ? payload.title.trim() : '';
    const label = dto.label?.trim() || (draftTitle ? draftTitle.slice(0, 120) : 'Imported profile');

    const profile = await this.profileModel.create({
      orgId,
      label,
      title: typeof payload.title === 'string' ? payload.title : null,
      overview: typeof payload.overview === 'string' ? payload.overview : null,
      skills: Array.isArray(payload.skills)
        ? payload.skills.filter((s): s is string => typeof s === 'string')
        : [],
      hourlyRateMin: typeof payload.hourlyRateMin === 'number' ? payload.hourlyRateMin : null,
      hourlyRateMax: typeof payload.hourlyRateMax === 'number' ? payload.hourlyRateMax : null,
      country: typeof payload.country === 'string' ? payload.country : null,
      timezone: typeof payload.timezone === 'string' ? payload.timezone : null,
      languages: Array.isArray(payload.languages)
        ? payload.languages.filter((s): s is string => typeof s === 'string')
        : [],
      exclusions: [],
      profileUrl: typeof payload.profileUrl === 'string' ? payload.profileUrl : null,
      source: FreelancerProfileSource.EXTENSION,
      rawSnapshot:
        payload.rawSnapshot && typeof payload.rawSnapshot === 'object'
          ? (payload.rawSnapshot as Record<string, unknown>)
          : null,
    });

    await draft.destroy();

    const created = await this.profileModel.findByPk(profile.id, {
      attributes: [...FREELANCER_PROFILE_ATTRS],
    });
    if (!created) {
      throw codedNotFound(API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND);
    }
    return { profile: this.toProfileView(created) };
  }

  async discardImport(userId: string | undefined): Promise<{ ok: true }> {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.draftModel.destroy({ where: { orgId } });
    return { ok: true };
  }

  private async findOwnedProfile(orgId: string, profileId: string): Promise<FreelancerProfile> {
    const profile = await this.profileModel.findOne({
      where: { id: profileId, orgId },
      attributes: [...FREELANCER_PROFILE_ATTRS],
    });
    if (!profile) {
      throw codedNotFound(API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND);
    }
    return profile;
  }

  private async purgeExpiredDrafts(orgId: string): Promise<void> {
    await this.draftModel.destroy({
      where: { orgId, expiresAt: { [Op.lte]: new Date() } },
    });
  }

  private toProfileView(row: FreelancerProfile): FreelancerProfileView {
    return {
      id: row.id,
      orgId: row.orgId,
      label: row.label,
      title: row.title,
      overview: row.overview,
      skills: row.skills ?? [],
      hourlyRateMin: row.hourlyRateMin,
      hourlyRateMax: row.hourlyRateMax,
      country: row.country,
      timezone: row.timezone,
      languages: row.languages ?? [],
      exclusions: row.exclusions ?? [],
      profileUrl: row.profileUrl,
      source: row.source,
      updatedAt: row.updatedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toDraftView(row: ProfileImportDraft): PendingDraftView {
    return {
      id: row.id,
      payload: row.payload,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
    };
  }
}
