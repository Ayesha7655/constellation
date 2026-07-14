import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { API_ERROR_CODES } from '@constellation/shared';
import { codedNotFound } from '../../common/exceptions/coded-http.exception';
import {
  FREELANCER_PROFILE_ATTRS,
  PROFILE_IMPORT_DRAFT_ATTRS,
} from '../../database/attributes';
import { FreelancerProfileSource } from '../../database/enums';
import { FreelancerProfile } from '../../database/models/freelancer-profile.model';
import { ProfileImportDraft } from '../../database/models/profile-import-draft.model';
import { OrgContextService } from './org-context.service';
import { ImportFreelancerProfileDto } from './dto/import-freelancer-profile.dto';
import { UpdateFreelancerProfileDto } from './dto/update-freelancer-profile.dto';

const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((s) => s.trim());
}

@Injectable()
export class FreelancerProfileService {
  constructor(
    @InjectModel(FreelancerProfile) private readonly profileModel: typeof FreelancerProfile,
    @InjectModel(ProfileImportDraft) private readonly draftModel: typeof ProfileImportDraft,
    private readonly orgContext: OrgContextService,
  ) {}

  async getProfile(userId: string | undefined) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const profile = await this.profileModel.findOne({
      where: { orgId },
      attributes: [...FREELANCER_PROFILE_ATTRS],
    });
    if (!profile) {
      return { profile: null, pendingDraft: await this.getPendingDraft(orgId) };
    }
    return {
      profile: this.toResponse(profile),
      pendingDraft: await this.getPendingDraft(orgId),
    };
  }

  async updateProfile(userId: string | undefined, dto: UpdateFreelancerProfileDto) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const existing = await this.profileModel.findOne({
      where: { orgId },
      attributes: [...FREELANCER_PROFILE_ATTRS],
    });

    const payload = {
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
      source: existing?.source ?? FreelancerProfileSource.MANUAL,
    };

    if (existing) {
      await existing.update(payload);
      await existing.reload({ attributes: [...FREELANCER_PROFILE_ATTRS] });
      return { profile: this.toResponse(existing) };
    }

    const created = await this.profileModel.create({ orgId, ...payload });
    await created.reload({ attributes: [...FREELANCER_PROFILE_ATTRS] });
    return { profile: this.toResponse(created) };
  }

  async importDraft(userId: string | undefined, dto: ImportFreelancerProfileDto) {
    const { userId: id, orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const payload = {
      title: dto.title ?? null,
      overview: dto.overview ?? null,
      skills: dto.skills ?? [],
      hourlyRateMin: dto.hourlyRateMin ?? null,
      hourlyRateMax: dto.hourlyRateMax ?? null,
      country: dto.country ?? null,
      timezone: dto.timezone ?? null,
      languages: dto.languages ?? [],
      exclusions: dto.exclusions ?? [],
      profileUrl: dto.profileUrl ?? null,
      rawSnapshot: dto.rawSnapshot ?? null,
    };

    const expiresAt = new Date(Date.now() + DRAFT_TTL_MS);
    const existing = await this.draftModel.findOne({
      where: { orgId },
      attributes: [...PROFILE_IMPORT_DRAFT_ATTRS],
    });
    if (existing) {
      await existing.update({
        payload,
        createdByUserId: id,
        expiresAt,
      });
      await existing.reload({ attributes: [...PROFILE_IMPORT_DRAFT_ATTRS] });
      return {
        draft: {
          id: existing.id,
          payload: existing.payload,
          expiresAt: existing.expiresAt.toISOString(),
        },
      };
    }

    const draft = await this.draftModel.create({
      orgId,
      createdByUserId: id,
      payload,
      expiresAt,
    });
    return {
      draft: {
        id: draft.id,
        payload: draft.payload,
        expiresAt: draft.expiresAt.toISOString(),
      },
    };
  }

  async confirmImport(userId: string | undefined) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const draft = await this.draftModel.findOne({
      where: { orgId },
      attributes: [...PROFILE_IMPORT_DRAFT_ATTRS, 'createdByUserId'],
    });
    if (!draft || draft.expiresAt.getTime() < Date.now()) {
      if (draft) {
        await draft.destroy();
      }
      codedNotFound(API_ERROR_CODES.FREELANCER_PROFILE_DRAFT_NOT_FOUND);
    }

    const p = draft.payload;
    const payload = {
      title: typeof p.title === 'string' ? p.title : null,
      overview: typeof p.overview === 'string' ? p.overview : null,
      skills: asStringArray(p.skills),
      hourlyRateMin: typeof p.hourlyRateMin === 'number' ? p.hourlyRateMin : null,
      hourlyRateMax: typeof p.hourlyRateMax === 'number' ? p.hourlyRateMax : null,
      country: typeof p.country === 'string' ? p.country : null,
      timezone: typeof p.timezone === 'string' ? p.timezone : null,
      languages: asStringArray(p.languages),
      exclusions: asStringArray(p.exclusions),
      profileUrl: typeof p.profileUrl === 'string' ? p.profileUrl : null,
      source: FreelancerProfileSource.EXTENSION,
      rawSnapshot: (p.rawSnapshot as Record<string, unknown> | null | undefined) ?? null,
    };

    const existing = await this.profileModel.findOne({ where: { orgId }, attributes: [...FREELANCER_PROFILE_ATTRS] });
    if (existing) {
      await existing.update(payload);
      await existing.reload({ attributes: [...FREELANCER_PROFILE_ATTRS] });
      await draft.destroy();
      return { profile: this.toResponse(existing) };
    }

    const created = await this.profileModel.create({ orgId, ...payload });
    await created.reload({ attributes: [...FREELANCER_PROFILE_ATTRS] });
    await draft.destroy();
    return { profile: this.toResponse(created) };
  }

  async discardImport(userId: string | undefined) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.draftModel.destroy({ where: { orgId } });
    return { ok: true as const };
  }

  private async getPendingDraft(orgId: string) {
    const draft = await this.draftModel.findOne({
      where: { orgId },
      attributes: [...PROFILE_IMPORT_DRAFT_ATTRS],
    });
    if (!draft) {
      return null;
    }
    if (draft.expiresAt.getTime() < Date.now()) {
      await draft.destroy();
      return null;
    }
    return {
      id: draft.id,
      payload: draft.payload,
      expiresAt: draft.expiresAt.toISOString(),
    };
  }

  private toResponse(profile: FreelancerProfile) {
    return {
      id: profile.id,
      orgId: profile.orgId,
      title: profile.title,
      overview: profile.overview,
      skills: profile.skills ?? [],
      hourlyRateMin: profile.hourlyRateMin,
      hourlyRateMax: profile.hourlyRateMax,
      country: profile.country,
      timezone: profile.timezone,
      languages: profile.languages ?? [],
      exclusions: profile.exclusions ?? [],
      profileUrl: profile.profileUrl,
      source: profile.source,
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
