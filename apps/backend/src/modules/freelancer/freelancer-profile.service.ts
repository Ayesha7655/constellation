import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  API_ERROR_CODES,
  extractUpworkUidFromRawSnapshot,
  normalizeUpworkFreelancerProfileUrl,
  type ProfileImportMatchReason,
} from '@constellation/shared';
import { Op } from 'sequelize';
import { codedBadRequest, codedNotFound } from '../../common/exceptions/coded-http.exception';
import { sanitizeJsonRecord } from '../../common/utils/json-unicode';
import {
  FREELANCER_PROFILE_ATTRS,
  FREELANCER_PROFILE_MATCH_ATTRS,
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
import { UpworkOverviewService } from './upwork-overview.service';
import type {
  FreelancerProfileResult,
  FreelancerProfilesListResult,
  FreelancerProfileView,
  ImportDraftResult,
  PendingDraftView,
} from './types/freelancer-profile.types';

const DRAFT_TTL_MS = 30 * 60 * 1000;

function coalesceNonEmptyString(
  incoming: string | null | undefined,
  existing: string | null,
): string | null {
  if (typeof incoming === 'string' && incoming.trim().length > 0) return incoming.trim();
  return existing;
}

function coalesceNonEmptyList(incoming: string[], existing: string[]): string[] {
  const next = incoming.filter((item) => typeof item === 'string' && item.trim().length > 0);
  return next.length > 0 ? next : existing;
}

function coalescePresentNumber(
  incoming: number | null | undefined,
  existing: number | null,
): number | null {
  return typeof incoming === 'number' && Number.isFinite(incoming) ? incoming : existing;
}

type DraftProfileFields = {
  title: string | null;
  overview: string | null;
  skills: string[];
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  country: string | null;
  timezone: string | null;
  languages: string[];
  profileUrl: string | null;
  rawSnapshot: Record<string, unknown> | null;
};

@Injectable()
export class FreelancerProfileService {
  constructor(
    @InjectModel(FreelancerProfile) private readonly profileModel: typeof FreelancerProfile,
    @InjectModel(ProfileImportDraft) private readonly draftModel: typeof ProfileImportDraft,
    @InjectModel(SearchFilterSet) private readonly filterSetModel: typeof SearchFilterSet,
    private readonly orgContext: OrgContextService,
    private readonly upworkOverview: UpworkOverviewService,
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

    const profileUrl = normalizeUpworkFreelancerProfileUrl(dto.profileUrl);
    if (!profileUrl) {
      throw codedBadRequest(API_ERROR_CODES.FREELANCER_PROFILE_IMPORT_INVALID);
    }

    const title = typeof dto.title === 'string' ? dto.title.trim() : '';
    const overview = typeof dto.overview === 'string' ? dto.overview.trim() : '';
    const skills = (dto.skills ?? []).filter((s) => typeof s === 'string' && s.trim().length > 0);
    if (!title && !overview && skills.length === 0) {
      throw codedBadRequest(API_ERROR_CODES.FREELANCER_PROFILE_IMPORT_INVALID);
    }

    const upworkUid = extractUpworkUidFromRawSnapshot(dto.rawSnapshot);
    const match = await this.findMatchingProfile(orgId, profileUrl, upworkUid);
    const targetProfileId = match?.id ?? null;
    const matchReason = match?.reason ?? null;

    const expiresAt = new Date(Date.now() + DRAFT_TTL_MS);
    const payload = sanitizeJsonRecord({
      title: title || null,
      overview: overview || null,
      skills,
      hourlyRateMin: dto.hourlyRateMin ?? null,
      hourlyRateMax: dto.hourlyRateMax ?? null,
      country: dto.country ?? null,
      timezone: dto.timezone ?? null,
      languages: dto.languages ?? [],
      profileUrl,
      rawSnapshot: dto.rawSnapshot ?? null,
      upworkUid,
      targetProfileId,
      matchReason,
    });

    const existing = await this.draftModel.findOne({
      where: { orgId },
      attributes: [...PROFILE_IMPORT_DRAFT_ATTRS],
    });

    if (existing) {
      await existing.update({ payload, expiresAt, createdByUserId: actorId });
      await this.upworkOverview.markOrgExtensionConnected(orgId);
      return {
        draft: this.toDraftView(existing),
        targetProfileId,
        matchReason,
      };
    }

    const created = await this.draftModel.create({
      orgId,
      createdByUserId: actorId,
      payload,
      expiresAt,
    });
    await this.upworkOverview.markOrgExtensionConnected(orgId);
    return {
      draft: this.toDraftView(created),
      targetProfileId,
      matchReason,
    };
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

    const fields = this.parseDraftProfileFields(draft.payload);
    const draftTitle = fields.title?.trim() ?? '';
    const label = dto.label?.trim() || (draftTitle ? draftTitle.slice(0, 120) : 'Imported profile');
    const targetProfileId =
      typeof draft.payload.targetProfileId === 'string' ? draft.payload.targetProfileId : null;

    if (targetProfileId) {
      const existing = await this.profileModel.findOne({
        where: { id: targetProfileId, orgId },
        attributes: [...FREELANCER_PROFILE_ATTRS, 'rawSnapshot'],
      });
      if (existing) {
        // Only overwrite with non-empty draft values — keep prior fields when scrape omitted them.
        await existing.update({
          label: dto.label?.trim() || existing.label || label,
          title: coalesceNonEmptyString(fields.title, existing.title),
          overview: coalesceNonEmptyString(fields.overview, existing.overview),
          skills: coalesceNonEmptyList(fields.skills, existing.skills ?? []),
          hourlyRateMin: coalescePresentNumber(fields.hourlyRateMin, existing.hourlyRateMin),
          hourlyRateMax: coalescePresentNumber(fields.hourlyRateMax, existing.hourlyRateMax),
          country: coalesceNonEmptyString(fields.country, existing.country),
          timezone: coalesceNonEmptyString(fields.timezone, existing.timezone),
          languages: coalesceNonEmptyList(fields.languages, existing.languages ?? []),
          profileUrl: coalesceNonEmptyString(fields.profileUrl, existing.profileUrl),
          source: FreelancerProfileSource.EXTENSION,
          rawSnapshot: fields.rawSnapshot ?? existing.rawSnapshot,
        });

        await draft.destroy();
        await this.upworkOverview.markOrgExtensionConnected(orgId);

        const refreshed = await this.profileModel.findByPk(existing.id, {
          attributes: [...FREELANCER_PROFILE_ATTRS],
        });
        if (!refreshed) {
          throw codedNotFound(API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND);
        }
        return { profile: this.toProfileView(refreshed) };
      }
    }

    const profile = await this.profileModel.create({
      orgId,
      label,
      title: fields.title,
      overview: fields.overview,
      skills: fields.skills,
      hourlyRateMin: fields.hourlyRateMin,
      hourlyRateMax: fields.hourlyRateMax,
      country: fields.country,
      timezone: fields.timezone,
      languages: fields.languages,
      exclusions: [],
      profileUrl: fields.profileUrl,
      source: FreelancerProfileSource.EXTENSION,
      rawSnapshot: fields.rawSnapshot,
    });

    await draft.destroy();
    await this.upworkOverview.markOrgExtensionConnected(orgId);

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

  private async findMatchingProfile(
    orgId: string,
    profileUrl: string,
    upworkUid: string | null,
  ): Promise<{ id: string; reason: ProfileImportMatchReason } | null> {
    const profiles = await this.profileModel.findAll({
      where: { orgId },
      attributes: [...FREELANCER_PROFILE_MATCH_ATTRS],
    });

    for (const profile of profiles) {
      const existingUrl = normalizeUpworkFreelancerProfileUrl(profile.profileUrl);
      if (existingUrl && existingUrl === profileUrl) {
        return { id: profile.id, reason: 'url' };
      }
    }

    if (upworkUid) {
      for (const profile of profiles) {
        const existingUid = extractUpworkUidFromRawSnapshot(profile.rawSnapshot);
        if (existingUid && existingUid === upworkUid) {
          return { id: profile.id, reason: 'uid' };
        }
      }
    }

    return null;
  }

  private parseDraftProfileFields(payload: Record<string, unknown>): DraftProfileFields {
    const normalizedUrl =
      typeof payload.profileUrl === 'string'
        ? normalizeUpworkFreelancerProfileUrl(payload.profileUrl)
        : null;

    return {
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
      profileUrl: normalizedUrl ?? (typeof payload.profileUrl === 'string' ? payload.profileUrl : null),
      rawSnapshot:
        payload.rawSnapshot && typeof payload.rawSnapshot === 'object' && !Array.isArray(payload.rawSnapshot)
          ? (payload.rawSnapshot as Record<string, unknown>)
          : null,
    };
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
