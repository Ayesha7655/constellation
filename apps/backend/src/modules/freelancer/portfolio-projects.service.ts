import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import {
  API_ERROR_CODES,
  buildUpworkPortfolioProjectUrl,
  normalizeUpworkFreelancerProfileUrl,
  parseUpworkPortfolioProjectId,
} from '@constellation/shared';
import { codedBadRequest, codedNotFound } from '../../common/exceptions/coded-http.exception';
import {
  FREELANCER_PROFILE_MATCH_ATTRS,
  PORTFOLIO_PROJECT_ATTRS,
} from '../../database/attributes';
import { FreelancerProfile } from '../../database/models/freelancer-profile.model';
import {
  PortfolioProject,
  type PortfolioProjectLink,
} from '../../database/models/portfolio-project.model';
import type { ImportPortfolioProjectDto } from './dto/import-portfolio-project.dto';
import { OrgContextService } from './org-context.service';

export type PortfolioProjectView = Readonly<{
  id: string;
  freelancerProfileId: string;
  externalId: string;
  projectUrl: string | null;
  title: string;
  role: string | null;
  description: string | null;
  technologies: string[];
  links: PortfolioProjectLink[];
  imageUrls: string[];
  publishedOn: string | null;
  source: string;
  scrapedAt: string;
  createdAt: string;
  updatedAt: string;
}>;

function cleanStringList(values: readonly string[] | undefined, max: number): string[] {
  if (!values?.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value || seen.has(value.toLocaleLowerCase())) continue;
    seen.add(value.toLocaleLowerCase());
    out.push(value.slice(0, 200));
    if (out.length >= max) break;
  }
  return out;
}

function cleanLinks(values: ImportPortfolioProjectDto['links']): PortfolioProjectLink[] {
  if (!values?.length) return [];
  const out: PortfolioProjectLink[] = [];
  const seen = new Set<string>();
  for (const item of values) {
    const url = typeof item.url === 'string' ? item.url.trim() : '';
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const label = typeof item.label === 'string' ? item.label.trim() : '';
    out.push(label ? { label: label.slice(0, 120), url: url.slice(0, 2000) } : { url: url.slice(0, 2000) });
    if (out.length >= 20) break;
  }
  return out;
}

function resolveProjectUrl(
  scrapedProjectUrl: string | undefined,
  profileUrl: string,
  externalId: string,
): string | null {
  const scraped = typeof scrapedProjectUrl === 'string' ? scrapedProjectUrl.trim() : '';
  if (scraped && parseUpworkPortfolioProjectId(scraped) === externalId) {
    return buildUpworkPortfolioProjectUrl(scraped, externalId) ?? scraped.slice(0, 600);
  }
  return buildUpworkPortfolioProjectUrl(profileUrl, externalId);
}

function toView(row: PortfolioProject, profileUrlFallback?: string | null): PortfolioProjectView {
  const stored = typeof row.projectUrl === 'string' && row.projectUrl.trim() ? row.projectUrl.trim() : null;
  const projectUrl =
    stored ?? buildUpworkPortfolioProjectUrl(profileUrlFallback, row.externalId);
  return {
    id: row.id,
    freelancerProfileId: row.freelancerProfileId,
    externalId: row.externalId,
    projectUrl,
    title: row.title,
    role: row.role,
    description: row.description,
    technologies: Array.isArray(row.technologies) ? row.technologies : [],
    links: Array.isArray(row.links) ? row.links : [],
    imageUrls: Array.isArray(row.imageUrls) ? row.imageUrls : [],
    publishedOn: row.publishedOn,
    source: row.source,
    scrapedAt: row.scrapedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class PortfolioProjectsService {
  constructor(
    private readonly orgContext: OrgContextService,
    @InjectModel(FreelancerProfile) private readonly profileModel: typeof FreelancerProfile,
    @InjectModel(PortfolioProject) private readonly portfolioModel: typeof PortfolioProject,
  ) {}

  async importProject(userId: string | undefined, dto: ImportPortfolioProjectDto) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const profileUrl = normalizeUpworkFreelancerProfileUrl(dto.profileUrl);
    const externalId = dto.externalId.trim();
    const title = dto.title.trim();
    if (!profileUrl || !externalId || !title) {
      throw codedBadRequest(API_ERROR_CODES.PORTFOLIO_PROJECT_IMPORT_INVALID);
    }

    const profiles = await this.profileModel.findAll({
      where: { orgId },
      attributes: [...FREELANCER_PROFILE_MATCH_ATTRS],
    });
    const profile = profiles.find(
      (row) => normalizeUpworkFreelancerProfileUrl(row.profileUrl) === profileUrl,
    );
    if (!profile) {
      throw codedNotFound(API_ERROR_CODES.PORTFOLIO_PROJECT_PROFILE_REQUIRED);
    }

    const technologies = cleanStringList(dto.technologies, 50);
    const links = cleanLinks(dto.links);
    const imageUrls = cleanStringList(dto.imageUrls, 30);
    const role = typeof dto.role === 'string' && dto.role.trim() ? dto.role.trim().slice(0, 200) : null;
    const description =
      typeof dto.description === 'string' && dto.description.trim()
        ? dto.description.trim().slice(0, 20000)
        : null;
    const publishedOn =
      typeof dto.publishedOn === 'string' && dto.publishedOn.trim()
        ? dto.publishedOn.trim().slice(0, 120)
        : null;
    const projectUrl = resolveProjectUrl(dto.projectUrl, profileUrl, externalId);
    const scrapedAt = new Date();
    const payload = {
      projectUrl,
      title,
      role,
      description,
      technologies,
      links,
      imageUrls,
      publishedOn,
      source: 'extension' as const,
      scrapedAt,
    };

    const existing = await this.portfolioModel.findOne({
      where: { freelancerProfileId: profile.id, externalId },
      attributes: [...PORTFOLIO_PROJECT_ATTRS],
    });

    if (existing) {
      await existing.update({
        ...payload,
        rawSnapshot: dto.rawSnapshot ?? existing.rawSnapshot,
      });
      await existing.reload({ attributes: [...PORTFOLIO_PROJECT_ATTRS] });
      return { project: toView(existing, profileUrl), created: false };
    }

    try {
      const created = await this.portfolioModel.create({
        freelancerProfileId: profile.id,
        externalId,
        ...payload,
        rawSnapshot: dto.rawSnapshot ?? null,
      });
      await created.reload({ attributes: [...PORTFOLIO_PROJECT_ATTRS] });
      return { project: toView(created, profileUrl), created: true };
    } catch (error) {
      // Concurrent sync hit unique (profile_id, external_id) — retry as update.
      if (!(error instanceof UniqueConstraintError)) throw error;
      const raced = await this.portfolioModel.findOne({
        where: { freelancerProfileId: profile.id, externalId },
        attributes: [...PORTFOLIO_PROJECT_ATTRS],
      });
      if (!raced) throw error;
      await raced.update({
        ...payload,
        rawSnapshot: dto.rawSnapshot ?? raced.rawSnapshot,
      });
      await raced.reload({ attributes: [...PORTFOLIO_PROJECT_ATTRS] });
      return { project: toView(raced, profileUrl), created: false };
    }
  }

  async listForProfile(userId: string | undefined, profileId: string) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const profile = await this.requireOrgProfile(orgId, profileId);

    const rows = await this.portfolioModel.findAll({
      where: { freelancerProfileId: profileId },
      attributes: [...PORTFOLIO_PROJECT_ATTRS],
      order: [
        ['scraped_at', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
    return { projects: rows.map((row) => toView(row, profile.profileUrl)) };
  }

  async getProject(userId: string | undefined, profileId: string, projectId: string) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const profile = await this.requireOrgProfile(orgId, profileId);
    const row = await this.portfolioModel.findOne({
      where: { id: projectId, freelancerProfileId: profileId },
      attributes: [...PORTFOLIO_PROJECT_ATTRS],
    });
    if (!row) {
      throw codedNotFound(API_ERROR_CODES.PORTFOLIO_PROJECT_NOT_FOUND);
    }
    return { project: toView(row, profile.profileUrl) };
  }

  async deleteProject(userId: string | undefined, profileId: string, projectId: string) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.requireOrgProfile(orgId, profileId);
    const row = await this.portfolioModel.findOne({
      where: { id: projectId, freelancerProfileId: profileId },
      attributes: [...PORTFOLIO_PROJECT_ATTRS],
    });
    if (!row) {
      throw codedNotFound(API_ERROR_CODES.PORTFOLIO_PROJECT_NOT_FOUND);
    }
    await row.destroy();
    return { ok: true as const };
  }

  private async requireOrgProfile(orgId: string, profileId: string) {
    const profile = await this.profileModel.findOne({
      where: { id: profileId, orgId },
      attributes: ['id', 'profileUrl'],
    });
    if (!profile) {
      throw codedNotFound(API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND);
    }
    return profile;
  }
}
