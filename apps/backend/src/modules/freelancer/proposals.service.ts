import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import {
  API_ERROR_CODES,
  PROPOSAL_ATTACHMENT_ALLOWED_MIME_TYPES,
  PROPOSAL_ATTACHMENT_MAX_BYTES,
  PROPOSAL_ATTACHMENT_MAX_COUNT,
  type ProposalAttachmentMeta,
  type ProposalStylePreferences,
  PROPOSAL_BODY_MAX_LENGTH,
  PROPOSAL_STYLE_EXTRACT_MIN_EXAMPLES,
  assertProposalAttachmentStorageKey,
  buildProposalAttachmentStorageKey,
  buildUpworkPortfolioProjectUrl,
  isProposalAttachmentStorageKey,
  isUpworkJobUrl,
  normalizeUpworkJobUrl,
  parseUpworkJobExternalId,
} from '@constellation/shared';
import { ObjectStorageService } from '../../common/storage/object-storage.service';
import { codedBadRequest, codedNotFound } from '../../common/exceptions/coded-http.exception';
import { requireAuthUserId } from '../../common/utils/require-auth-user-id';
import {
  FREELANCER_PROFILE_ATTRS,
  PORTFOLIO_PROJECT_ATTRS,
  PROPOSAL_ATTACHMENT_ATTRS,
  PROPOSAL_DRAFT_ATTRS,
  PROPOSAL_EXAMPLE_ATTRS,
  PROPOSAL_STYLE_PACK_ATTRS,
  UPWORK_JOB_ATTRS,
} from '../../database/attributes';
import {
  ProposalDraftProvenance,
  ProposalDraftSource,
  ProposalDraftStatus,
  ProposalExampleSource,
} from '../../database/enums';
import { FreelancerProfile } from '../../database/models/freelancer-profile.model';
import { PortfolioProject } from '../../database/models/portfolio-project.model';
import { ProposalAttachment } from '../../database/models/proposal-attachment.model';
import { ProposalDraft } from '../../database/models/proposal-draft.model';
import { ProposalExample } from '../../database/models/proposal-example.model';
import { ProposalStylePack } from '../../database/models/proposal-style-pack.model';
import { UpworkJob } from '../../database/models/upwork-job.model';
import { AiServiceClient } from './ai-service.client';
import type { UploadProposalAttachmentDto } from './dto/proposal-attachment.dto';
import type { CreateProposalExampleDto, UpdateProposalExampleDto } from './dto/proposal-example.dto';
import type { GenerateProposalFromJobUrlDto } from './dto/generate-proposal-from-job-url.dto';
import type { SaveProposalDraftDto } from './dto/save-proposal-draft.dto';
import type { UpsertProposalStylePackDto } from './dto/upsert-proposal-style-pack.dto';
import { OrgContextService } from './org-context.service';
import { ProposalAttachmentUploadRegistry } from './proposal-attachment-upload-registry.service';
import { combineProposalOutput, resolvePortfolioMatches } from './proposals/combine-proposal-output';
import { rankProposalExamples, rankedExampleIds } from './proposals/rank-proposal-examples';

const ALLOWED_MIME = new Set<string>(PROPOSAL_ATTACHMENT_ALLOWED_MIME_TYPES);

function asPreferences(raw: Record<string, unknown> | null | undefined): ProposalStylePreferences {
  if (!raw || typeof raw !== 'object') return {};
  return {
    tone: typeof raw.tone === 'string' ? raw.tone : null,
    lengthTarget: typeof raw.lengthTarget === 'string' ? raw.lengthTarget : null,
    structureNotes: typeof raw.structureNotes === 'string' ? raw.structureNotes : null,
    alwaysUse: Array.isArray(raw.alwaysUse)
      ? raw.alwaysUse.filter((item): item is string => typeof item === 'string')
      : [],
    neverUse: Array.isArray(raw.neverUse)
      ? raw.neverUse.filter((item): item is string => typeof item === 'string')
      : [],
    rateMentionPolicy: typeof raw.rateMentionPolicy === 'string' ? raw.rateMentionPolicy : null,
    ctaStyle: typeof raw.ctaStyle === 'string' ? raw.ctaStyle : null,
    extraNotes: typeof raw.extraNotes === 'string' ? raw.extraNotes : null,
  };
}

function decodeBase64Payload(raw: string): { buffer: Buffer; mimeFromDataUrl: string | null } {
  const trimmed = raw.trim();
  if (trimmed.startsWith('data:')) {
    const comma = trimmed.indexOf(',');
    const header = comma >= 0 ? trimmed.slice(5, comma) : '';
    const payload = comma >= 0 ? trimmed.slice(comma + 1) : '';
    const mime = header.split(';')[0]?.trim() || null;
    return { buffer: Buffer.from(payload, 'base64'), mimeFromDataUrl: mime };
  }
  return { buffer: Buffer.from(trimmed, 'base64'), mimeFromDataUrl: null };
}

function inferMimeType(fileName: string, provided: string | null | undefined): string {
  const normalized = provided?.trim().toLowerCase();
  if (normalized && ALLOWED_MIME.has(normalized)) return normalized;
  const ext = /\.([a-z0-9]+)$/i.exec(fileName)?.[1]?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'rtf':
      return 'application/rtf';
    case 'txt':
      return 'text/plain';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    default:
      return normalized || 'application/octet-stream';
  }
}

@Injectable()
export class ProposalsService {
  constructor(
    @InjectModel(FreelancerProfile) private readonly profileModel: typeof FreelancerProfile,
    @InjectModel(ProposalStylePack) private readonly stylePackModel: typeof ProposalStylePack,
    @InjectModel(ProposalExample) private readonly exampleModel: typeof ProposalExample,
    @InjectModel(ProposalDraft) private readonly draftModel: typeof ProposalDraft,
    @InjectModel(ProposalAttachment) private readonly attachmentModel: typeof ProposalAttachment,
    @InjectModel(UpworkJob) private readonly jobModel: typeof UpworkJob,
    @InjectModel(PortfolioProject) private readonly portfolioModel: typeof PortfolioProject,
    private readonly orgContext: OrgContextService,
    private readonly aiServiceClient: AiServiceClient,
    private readonly objectStorage: ObjectStorageService,
    private readonly uploadRegistry: ProposalAttachmentUploadRegistry,
  ) {}

  async getStylePack(userId: string | undefined, profileId: string) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.requireOwnedProfile(orgId, profileId);
    const row = await this.stylePackModel.findOne({
      where: { orgId, freelancerProfileId: profileId },
      attributes: [...PROPOSAL_STYLE_PACK_ATTRS],
    });
    return {
      freelancerProfileId: profileId,
      preferences: asPreferences(row?.preferences ?? {}),
      updatedAt: row?.updatedAt.toISOString() ?? null,
    };
  }

  async upsertStylePack(userId: string | undefined, profileId: string, dto: UpsertProposalStylePackDto) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.requireOwnedProfile(orgId, profileId);
    const preferences = asPreferences(dto.preferences as Record<string, unknown>);
    return this.persistStylePack(orgId, profileId, preferences);
  }

  async extractStylePackFromExamples(userId: string | undefined, profileId: string) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.requireOwnedProfile(orgId, profileId);

    const examples = await this.exampleModel.findAll({
      where: { orgId, freelancerProfileId: profileId },
      attributes: [...PROPOSAL_EXAMPLE_ATTRS],
      order: [
        ['isStarred', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    if (examples.length < PROPOSAL_STYLE_EXTRACT_MIN_EXAMPLES) {
      throw codedBadRequest(API_ERROR_CODES.PROPOSAL_EXAMPLES_REQUIRED);
    }

    const { preferences } = await this.aiServiceClient.extractStylePack({
      examples: examples.slice(0, 12).map((example) => ({
        title: example.title,
        body: example.body,
        jobContext: example.jobContext,
      })),
    });

    return this.persistStylePack(orgId, profileId, asPreferences(preferences as Record<string, unknown>));
  }

  private async persistStylePack(orgId: string, profileId: string, preferences: ProposalStylePreferences) {
    const existing = await this.stylePackModel.findOne({
      where: { orgId, freelancerProfileId: profileId },
      attributes: [...PROPOSAL_STYLE_PACK_ATTRS],
    });
    if (existing) {
      await existing.update({ preferences });
      await existing.reload({ attributes: [...PROPOSAL_STYLE_PACK_ATTRS] });
      return {
        freelancerProfileId: profileId,
        preferences: asPreferences(existing.preferences),
        updatedAt: existing.updatedAt.toISOString(),
      };
    }

    const created = await this.stylePackModel.create({
      orgId,
      freelancerProfileId: profileId,
      preferences,
    });
    await created.reload({ attributes: [...PROPOSAL_STYLE_PACK_ATTRS] });
    return {
      freelancerProfileId: profileId,
      preferences: asPreferences(created.preferences),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async listExamples(userId: string | undefined, profileId: string) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.requireOwnedProfile(orgId, profileId);
    const rows = await this.exampleModel.findAll({
      where: { orgId, freelancerProfileId: profileId },
      attributes: [...PROPOSAL_EXAMPLE_ATTRS],
      order: [
        ['isStarred', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
    const attachmentsByExample = await this.loadAttachmentsByExampleIds(
      orgId,
      profileId,
      rows.map((row) => row.id),
    );
    return {
      examples: rows.map((row) => this.toExampleView(row, attachmentsByExample.get(row.id) ?? [])),
    };
  }

  async createExample(userId: string | undefined, profileId: string, dto: CreateProposalExampleDto) {
    const authUserId = requireAuthUserId(userId);
    const { orgId } = await this.orgContext.requireOrgIdForUser(authUserId);
    await this.requireOwnedProfile(orgId, profileId);

    const keys = (dto.attachmentStorageKeys ?? []).map((key) => key.trim()).filter(Boolean);
    if (keys.length > PROPOSAL_ATTACHMENT_MAX_COUNT) {
      throw codedBadRequest(API_ERROR_CODES.PROPOSAL_ATTACHMENT_LIMIT);
    }
    for (const key of keys) {
      this.uploadRegistry.assertKeyForUser(authUserId, orgId, key);
    }

    const created = await this.exampleModel.create({
      orgId,
      freelancerProfileId: profileId,
      title: dto.title?.trim() || null,
      body: dto.body.trim(),
      jobContext: dto.jobContext?.trim() || null,
      isStarred: dto.isStarred ?? false,
      source: ProposalExampleSource.UPLOAD,
    });
    await created.reload({ attributes: [...PROPOSAL_EXAMPLE_ATTRS] });

    const attachments: ProposalAttachmentMeta[] = [];
    try {
      for (const [index, key] of keys.entries()) {
        attachments.push(
          await this.persistRegisteredAttachment({
            userId: authUserId,
            orgId,
            profileId,
            storageKey: key,
            proposalExampleId: created.id,
            proposalDraftId: null,
            sortOrder: index + 1,
          }),
        );
      }
    } catch (error) {
      for (const attachment of attachments) {
        await this.objectStorage.deleteObject(attachment.storageKey);
        await this.attachmentModel.destroy({ where: { id: attachment.id } });
      }
      await created.destroy();
      throw error;
    }

    return { example: this.toExampleView(created, attachments) };
  }

  async updateExample(userId: string | undefined, profileId: string, exampleId: string, dto: UpdateProposalExampleDto) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.requireOwnedProfile(orgId, profileId);
    const example = await this.exampleModel.findOne({
      where: { id: exampleId, orgId, freelancerProfileId: profileId },
      attributes: [...PROPOSAL_EXAMPLE_ATTRS],
    });
    if (!example) {
      throw codedNotFound(API_ERROR_CODES.PROPOSAL_EXAMPLE_NOT_FOUND);
    }
    await example.update({
      title: dto.title !== undefined ? dto.title?.trim() || null : example.title,
      body: dto.body !== undefined ? dto.body.trim() : example.body,
      jobContext: dto.jobContext !== undefined ? dto.jobContext?.trim() || null : example.jobContext,
      isStarred: dto.isStarred !== undefined ? dto.isStarred : example.isStarred,
    });
    await example.reload({ attributes: [...PROPOSAL_EXAMPLE_ATTRS] });
    const attachments = await this.listAttachmentsForExample(orgId, profileId, example.id);
    return { example: this.toExampleView(example, attachments) };
  }

  async deleteExample(userId: string | undefined, profileId: string, exampleId: string) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.requireOwnedProfile(orgId, profileId);
    const example = await this.exampleModel.findOne({
      where: { id: exampleId, orgId, freelancerProfileId: profileId },
      attributes: [...PROPOSAL_EXAMPLE_ATTRS],
    });
    if (!example) {
      throw codedNotFound(API_ERROR_CODES.PROPOSAL_EXAMPLE_NOT_FOUND);
    }
    const attachments = await this.attachmentModel.findAll({
      where: { orgId, freelancerProfileId: profileId, proposalExampleId: exampleId },
      attributes: [...PROPOSAL_ATTACHMENT_ATTRS],
    });
    for (const attachment of attachments) {
      await this.objectStorage.deleteObject(attachment.storageKey);
    }
    await example.destroy();
    return { ok: true as const };
  }

  async getDraft(userId: string | undefined, profileId: string, jobId: string) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.requireOwnedProfile(orgId, profileId);
    await this.requireOwnedJob(orgId, jobId);
    const draft = await this.draftModel.findOne({
      where: { orgId, freelancerProfileId: profileId, upworkJobId: jobId },
      attributes: [...PROPOSAL_DRAFT_ATTRS],
    });
    if (!draft) return { draft: null };
    const attachments = await this.listAttachmentsForDraft(orgId, profileId, draft.id);
    return { draft: this.toDraftView(draft, attachments) };
  }

  async generateDraft(
    userId: string | undefined,
    profileId: string,
    jobId: string,
    options?: Readonly<{ source?: ProposalDraftSource }>,
  ) {
    const source = options?.source ?? ProposalDraftSource.WEB;
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const profile = await this.requireOwnedProfile(orgId, profileId);
    const job = await this.requireOwnedJob(orgId, jobId);

    const [stylePack, examples, portfolioRows] = await Promise.all([
      this.stylePackModel.findOne({
        where: { orgId, freelancerProfileId: profileId },
        attributes: [...PROPOSAL_STYLE_PACK_ATTRS],
      }),
      this.exampleModel.findAll({
        where: { orgId, freelancerProfileId: profileId },
        attributes: [...PROPOSAL_EXAMPLE_ATTRS],
        order: [['createdAt', 'DESC']],
      }),
      this.portfolioModel.findAll({
        where: { freelancerProfileId: profileId },
        attributes: [...PORTFOLIO_PROJECT_ATTRS],
        limit: 50,
        order: [
          ['scraped_at', 'DESC'],
          ['created_at', 'DESC'],
        ],
      }),
    ]);

    const preferences = asPreferences(stylePack?.preferences ?? {});
    const jobText = `${job.title}\n${job.description}`;
    const selectedExamples = rankProposalExamples(jobText, job.skills ?? [], examples);
    const selectedIds = rankedExampleIds(jobText, job.skills ?? [], examples);
    const jobInput = {
      title: job.title,
      description: job.description.slice(0, 12000),
      skills: job.skills ?? [],
      budget: job.budget,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      clientLocation: job.clientLocation,
    };
    const portfolioCandidates = portfolioRows
      .map((row) => ({
        id: row.id,
        title: row.title,
        role: row.role,
        description: row.description?.slice(0, 2000) ?? null,
        technologies: Array.isArray(row.technologies) ? row.technologies.slice(0, 30) : [],
        projectUrl: row.projectUrl ?? buildUpworkPortfolioProjectUrl(profile.profileUrl, row.externalId),
        links: Array.isArray(row.links) ? row.links.slice(0, 10) : [],
      }))
      .filter(
        (project) => Boolean(project.projectUrl?.trim()) || project.links.some((link) => Boolean(link.url.trim())),
      );

    const [proposalResult, portfolioResult] = await Promise.all([
      this.aiServiceClient.generateProposal({
        stylePack: preferences,
        profile: {
          title: profile.title,
          overview: profile.overview,
          skills: profile.skills ?? [],
          hourlyRateMin: profile.hourlyRateMin,
          hourlyRateMax: profile.hourlyRateMax,
          country: profile.country,
          languages: profile.languages ?? [],
        },
        job: jobInput,
        examples: selectedExamples,
      }),
      portfolioCandidates.length > 0
        ? this.aiServiceClient.findRelevantPortfolio({
            job: jobInput,
            portfolio: portfolioCandidates,
          })
        : Promise.resolve({ matches: [] }),
    ]);

    const resolvedPortfolio = resolvePortfolioMatches(portfolioResult.matches, portfolioCandidates);
    const trimmedBody = combineProposalOutput(proposalResult.body, resolvedPortfolio);
    const modelMeta = {
      exampleIds: selectedIds,
      portfolioIds: resolvedPortfolio.map((match) => match.portfolioProjectId),
    };
    const draftSource =
      source === ProposalDraftSource.EXTENSION_JOB_PAGE
        ? ProposalDraftSource.EXTENSION_JOB_PAGE
        : ProposalDraftSource.WEB;

    const existing = await this.draftModel.findOne({
      where: { orgId, freelancerProfileId: profileId, upworkJobId: jobId },
      attributes: [...PROPOSAL_DRAFT_ATTRS],
    });

    let draft: ProposalDraft;
    if (existing) {
      await existing.update({
        body: trimmedBody,
        status: ProposalDraftStatus.SAVED,
        provenance: ProposalDraftProvenance.AI,
        source: draftSource,
        modelMeta,
      });
      await existing.reload({ attributes: [...PROPOSAL_DRAFT_ATTRS] });
      draft = existing;
    } else {
      draft = await this.draftModel.create({
        orgId,
        freelancerProfileId: profileId,
        upworkJobId: jobId,
        body: trimmedBody,
        status: ProposalDraftStatus.SAVED,
        provenance: ProposalDraftProvenance.AI,
        source: draftSource,
        modelMeta,
      });
      await draft.reload({ attributes: [...PROPOSAL_DRAFT_ATTRS] });
    }

    const attachments = await this.listAttachmentsForDraft(orgId, profileId, draft.id);
    return { draft: this.toDraftView(draft, attachments) };
  }

  async generateDraftFromJobUrl(userId: string | undefined, profileId: string, dto: GenerateProposalFromJobUrlDto) {
    const jobUrl = dto.jobUrl.trim();
    if (!isUpworkJobUrl(jobUrl)) {
      throw codedBadRequest(API_ERROR_CODES.PROPOSAL_INVALID_JOB_URL);
    }

    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.requireOwnedProfile(orgId, profileId);

    const job = await this.findOrgJobByUpworkUrl(orgId, jobUrl);
    if (!job) {
      throw codedNotFound(API_ERROR_CODES.UPWORK_JOB_NOT_IN_LIBRARY);
    }

    return this.generateDraft(userId, profileId, job.id, {
      source: ProposalDraftSource.EXTENSION_JOB_PAGE,
    });
  }

  private async findOrgJobByUpworkUrl(orgId: string, jobUrl: string): Promise<UpworkJob | null> {
    const normalizedUrl = normalizeUpworkJobUrl(jobUrl);
    const externalJobId = parseUpworkJobExternalId(jobUrl);
    const rows = await this.jobModel.findAll({
      where: {
        orgId,
        [Op.or]: [
          { jobUrl: normalizedUrl },
          ...(externalJobId
            ? [
                { externalJobId },
                { jobUrl: { [Op.like]: `%~0${externalJobId}/%` } },
                { jobUrl: { [Op.like]: `%~0${externalJobId}?%` } },
                { jobUrl: { [Op.like]: `%~0${externalJobId}` } },
              ]
            : []),
        ],
      },
      attributes: [...UPWORK_JOB_ATTRS],
      order: [['scrapedAt', 'DESC']],
      limit: 20,
    });

    const byExactUrl = rows.find((row) => row.jobUrl === normalizedUrl);
    if (byExactUrl) return byExactUrl;
    if (externalJobId) {
      const byExternal = rows.find((row) => row.externalJobId === externalJobId);
      if (byExternal) return byExternal;
    }
    return rows[0] ?? null;
  }

  async saveDraft(userId: string | undefined, profileId: string, jobId: string, dto: SaveProposalDraftDto) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.requireOwnedProfile(orgId, profileId);
    await this.requireOwnedJob(orgId, jobId);

    const body = dto.body.trim().slice(0, PROPOSAL_BODY_MAX_LENGTH);
    const existing = await this.draftModel.findOne({
      where: { orgId, freelancerProfileId: profileId, upworkJobId: jobId },
      attributes: [...PROPOSAL_DRAFT_ATTRS],
    });

    let draft: ProposalDraft;
    if (existing) {
      await existing.update({
        body,
        status: ProposalDraftStatus.SAVED,
        provenance: ProposalDraftProvenance.MANUAL,
      });
      await existing.reload({ attributes: [...PROPOSAL_DRAFT_ATTRS] });
      draft = existing;
    } else {
      draft = await this.draftModel.create({
        orgId,
        freelancerProfileId: profileId,
        upworkJobId: jobId,
        body,
        status: ProposalDraftStatus.SAVED,
        provenance: ProposalDraftProvenance.MANUAL,
        source: ProposalDraftSource.WEB,
        modelMeta: null,
      });
      await draft.reload({ attributes: [...PROPOSAL_DRAFT_ATTRS] });
    }

    if (dto.addToLibrary) {
      await this.exampleModel.create({
        orgId,
        freelancerProfileId: profileId,
        title: null,
        body,
        jobContext: null,
        isStarred: true,
        source: ProposalExampleSource.ACCEPTED_DRAFT,
      });
    }

    const attachments = await this.listAttachmentsForDraft(orgId, profileId, draft.id);
    return { draft: this.toDraftView(draft, attachments) };
  }

  async uploadAttachment(userId: string | undefined, profileId: string, dto: UploadProposalAttachmentDto) {
    const authUserId = requireAuthUserId(userId);
    const { orgId } = await this.orgContext.requireOrgIdForUser(authUserId);
    await this.requireOwnedProfile(orgId, profileId);

    const fileName = dto.fileName.trim();
    if (!fileName) {
      throw codedBadRequest(API_ERROR_CODES.PROPOSAL_ATTACHMENT_INVALID);
    }

    const { buffer, mimeFromDataUrl } = decodeBase64Payload(dto.base64);
    if (buffer.length === 0) {
      throw codedBadRequest(API_ERROR_CODES.PROPOSAL_ATTACHMENT_INVALID);
    }
    if (buffer.length > PROPOSAL_ATTACHMENT_MAX_BYTES) {
      throw codedBadRequest(API_ERROR_CODES.PROPOSAL_ATTACHMENT_TOO_LARGE);
    }

    const mimeType = inferMimeType(fileName, dto.mimeType ?? mimeFromDataUrl);
    if (!ALLOWED_MIME.has(mimeType)) {
      throw codedBadRequest(API_ERROR_CODES.PROPOSAL_ATTACHMENT_TYPE);
    }

    const storageKey = buildProposalAttachmentStorageKey(fileName, randomUUID());
    try {
      assertProposalAttachmentStorageKey(storageKey);
      await this.objectStorage.putObject(storageKey, buffer, mimeType);
    } catch {
      throw codedBadRequest(API_ERROR_CODES.PROPOSAL_ATTACHMENT_UPLOAD_FAILED);
    }

    this.uploadRegistry.registerUpload({
      key: storageKey,
      userId: authUserId,
      orgId,
      fileName,
      mimeType,
      sizeBytes: buffer.length,
    });

    return { storageKey, fileName, mimeType, sizeBytes: buffer.length };
  }

  async revertAttachmentUploads(userId: string | undefined, profileId: string, keys: string[]) {
    const authUserId = requireAuthUserId(userId);
    const { orgId } = await this.orgContext.requireOrgIdForUser(authUserId);
    await this.requireOwnedProfile(orgId, profileId);

    for (const rawKey of keys) {
      const key = rawKey.trim();
      if (!isProposalAttachmentStorageKey(key)) continue;
      try {
        this.uploadRegistry.assertKeyForUser(authUserId, orgId, key);
        await this.objectStorage.deleteObject(key);
        this.uploadRegistry.releaseKey(authUserId, key);
      } catch {
        // Best-effort orphan cleanup
      }
    }
    return { ok: true as const };
  }

  async attachToExample(userId: string | undefined, profileId: string, exampleId: string, storageKey: string) {
    const authUserId = requireAuthUserId(userId);
    const { orgId } = await this.orgContext.requireOrgIdForUser(authUserId);
    await this.requireOwnedProfile(orgId, profileId);
    const example = await this.exampleModel.findOne({
      where: { id: exampleId, orgId, freelancerProfileId: profileId },
      attributes: [...PROPOSAL_EXAMPLE_ATTRS],
    });
    if (!example) {
      throw codedNotFound(API_ERROR_CODES.PROPOSAL_EXAMPLE_NOT_FOUND);
    }

    const count = await this.attachmentModel.count({
      where: { orgId, freelancerProfileId: profileId, proposalExampleId: exampleId },
    });
    if (count >= PROPOSAL_ATTACHMENT_MAX_COUNT) {
      throw codedBadRequest(API_ERROR_CODES.PROPOSAL_ATTACHMENT_LIMIT);
    }

    const attachment = await this.persistRegisteredAttachment({
      userId: authUserId,
      orgId,
      profileId,
      storageKey: storageKey.trim(),
      proposalExampleId: exampleId,
      proposalDraftId: null,
      sortOrder: count + 1,
    });
    return { attachment };
  }

  async attachToDraft(userId: string | undefined, profileId: string, jobId: string, storageKey: string) {
    const authUserId = requireAuthUserId(userId);
    const { orgId } = await this.orgContext.requireOrgIdForUser(authUserId);
    await this.requireOwnedProfile(orgId, profileId);
    await this.requireOwnedJob(orgId, jobId);

    let draft = await this.draftModel.findOne({
      where: { orgId, freelancerProfileId: profileId, upworkJobId: jobId },
      attributes: [...PROPOSAL_DRAFT_ATTRS],
    });
    if (!draft) {
      draft = await this.draftModel.create({
        orgId,
        freelancerProfileId: profileId,
        upworkJobId: jobId,
        body: '',
        status: ProposalDraftStatus.DRAFT,
        provenance: ProposalDraftProvenance.MANUAL,
        source: ProposalDraftSource.WEB,
        modelMeta: null,
      });
      await draft.reload({ attributes: [...PROPOSAL_DRAFT_ATTRS] });
    }

    const count = await this.attachmentModel.count({
      where: { orgId, freelancerProfileId: profileId, proposalDraftId: draft.id },
    });
    if (count >= PROPOSAL_ATTACHMENT_MAX_COUNT) {
      throw codedBadRequest(API_ERROR_CODES.PROPOSAL_ATTACHMENT_LIMIT);
    }

    const attachment = await this.persistRegisteredAttachment({
      userId: authUserId,
      orgId,
      profileId,
      storageKey: storageKey.trim(),
      proposalExampleId: null,
      proposalDraftId: draft.id,
      sortOrder: count + 1,
    });
    return { attachment, draftId: draft.id };
  }

  async deleteAttachment(userId: string | undefined, profileId: string, attachmentId: string) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.requireOwnedProfile(orgId, profileId);
    const attachment = await this.attachmentModel.findOne({
      where: { id: attachmentId, orgId, freelancerProfileId: profileId },
      attributes: [...PROPOSAL_ATTACHMENT_ATTRS],
    });
    if (!attachment) {
      throw codedNotFound(API_ERROR_CODES.PROPOSAL_ATTACHMENT_NOT_FOUND);
    }
    await this.objectStorage.deleteObject(attachment.storageKey);
    await attachment.destroy();
    return { ok: true as const };
  }

  private async persistRegisteredAttachment(input: {
    userId: string;
    orgId: string;
    profileId: string;
    storageKey: string;
    proposalExampleId: string | null;
    proposalDraftId: string | null;
    sortOrder: number;
  }): Promise<ProposalAttachmentMeta> {
    if (!isProposalAttachmentStorageKey(input.storageKey)) {
      throw codedBadRequest(API_ERROR_CODES.PROPOSAL_ATTACHMENT_INVALID);
    }
    const registered = this.uploadRegistry.assertKeyForUser(input.userId, input.orgId, input.storageKey);
    const created = await this.attachmentModel.create({
      orgId: input.orgId,
      freelancerProfileId: input.profileId,
      proposalDraftId: input.proposalDraftId,
      proposalExampleId: input.proposalExampleId,
      storageKey: input.storageKey,
      fileName: registered.fileName,
      mimeType: registered.mimeType,
      sizeBytes: registered.sizeBytes,
      sortOrder: input.sortOrder,
    });
    await created.reload({ attributes: [...PROPOSAL_ATTACHMENT_ATTRS] });
    this.uploadRegistry.consumeKey(input.userId, input.storageKey);
    return this.toAttachmentView(created);
  }

  private async listAttachmentsForExample(
    orgId: string,
    profileId: string,
    exampleId: string,
  ): Promise<ProposalAttachmentMeta[]> {
    const rows = await this.attachmentModel.findAll({
      where: { orgId, freelancerProfileId: profileId, proposalExampleId: exampleId },
      attributes: [...PROPOSAL_ATTACHMENT_ATTRS],
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
    return rows.map((row) => this.toAttachmentView(row));
  }

  private async listAttachmentsForDraft(
    orgId: string,
    profileId: string,
    draftId: string,
  ): Promise<ProposalAttachmentMeta[]> {
    const rows = await this.attachmentModel.findAll({
      where: { orgId, freelancerProfileId: profileId, proposalDraftId: draftId },
      attributes: [...PROPOSAL_ATTACHMENT_ATTRS],
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
    return rows.map((row) => this.toAttachmentView(row));
  }

  private async loadAttachmentsByExampleIds(
    orgId: string,
    profileId: string,
    exampleIds: string[],
  ): Promise<Map<string, ProposalAttachmentMeta[]>> {
    const map = new Map<string, ProposalAttachmentMeta[]>();
    if (exampleIds.length === 0) return map;
    const rows = await this.attachmentModel.findAll({
      where: {
        orgId,
        freelancerProfileId: profileId,
        proposalExampleId: { [Op.in]: exampleIds },
      },
      attributes: [...PROPOSAL_ATTACHMENT_ATTRS],
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
    for (const row of rows) {
      const exampleId = row.proposalExampleId;
      if (!exampleId) continue;
      const list = map.get(exampleId) ?? [];
      list.push(this.toAttachmentView(row));
      map.set(exampleId, list);
    }
    return map;
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

  private async requireOwnedJob(orgId: string, jobId: string): Promise<UpworkJob> {
    const job = await this.jobModel.findOne({
      where: { id: jobId, orgId },
      attributes: [...UPWORK_JOB_ATTRS],
    });
    if (!job) {
      throw codedNotFound(API_ERROR_CODES.UPWORK_JOB_NOT_FOUND);
    }
    return job;
  }

  private toAttachmentView(row: ProposalAttachment): ProposalAttachmentMeta {
    return {
      id: row.id,
      storageKey: row.storageKey,
      fileName: row.fileName,
      mimeType: row.mimeType,
      sizeBytes: Number(row.sizeBytes),
      sortOrder: row.sortOrder,
    };
  }

  private toExampleView(row: ProposalExample, attachments: ProposalAttachmentMeta[]) {
    return {
      id: row.id,
      freelancerProfileId: row.freelancerProfileId,
      title: row.title,
      body: row.body,
      jobContext: row.jobContext,
      isStarred: row.isStarred,
      source: row.source,
      attachments,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toDraftView(row: ProposalDraft, attachments: ProposalAttachmentMeta[]) {
    return {
      id: row.id,
      freelancerProfileId: row.freelancerProfileId,
      upworkJobId: row.upworkJobId,
      body: row.body,
      status: row.status,
      provenance: row.provenance,
      source: row.source,
      modelMeta: row.modelMeta,
      attachments,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
