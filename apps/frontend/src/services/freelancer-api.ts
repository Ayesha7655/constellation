import { getDeviceId } from '@/lib/device-id';
import { getApiLocaleHeaders } from '@/lib/api-locale';
import { getAccessToken } from '@/lib/auth-session';
import { parseApiErrorResponse } from '@/lib/api-error';
import { trackFetch } from '@/lib/global-loading';
import { AuthRequestError, logTechnicalError } from '@/lib/user-messages';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4050/api';

export type FreelancerProfileDto = Readonly<{
  id: string;
  orgId: string;
  label: string | null;
  title: string | null;
  overview: string | null;
  skills: string[];
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  country: string | null;
  timezone: string | null;
  languages: string[];
  exclusions: string[];
  profileUrl: string | null;
  source: string;
  updatedAt: string;
  createdAt: string;
}>;

export type ProfileImportDraftDto = Readonly<{
  id: string;
  payload: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
}>;

export type FreelancerProfilesListResponse = Readonly<{
  profiles: FreelancerProfileDto[];
  pendingDraft: ProfileImportDraftDto | null;
}>;

export type SearchFiltersResponse = Readonly<{
  id?: string;
  orgId?: string;
  freelancerProfileId?: string;
  actorId: string;
  filters: Record<string, unknown> | null;
  provenance?: string;
  updatedAt?: string;
}>;

export type ExtensionPairingCodeResponse = Readonly<{
  code: string;
  expiresAt: string;
  expiresInSeconds: number;
}>;

export type UpdateFreelancerProfilePayload = Readonly<{
  label?: string | null;
  title?: string;
  overview?: string;
  skills?: string[];
  hourlyRateMin?: number | null;
  hourlyRateMax?: number | null;
  country?: string;
  timezone?: string;
  languages?: string[];
  exclusions?: string[];
  profileUrl?: string;
}>;

async function readTechnicalErrorMessage(response: Response): Promise<{ code?: string; rawMessage: string }> {
  const text = await response.text();
  try {
    const json: unknown = JSON.parse(text);
    return parseApiErrorResponse(response.status, json);
  } catch {
    /* use raw text */
  }
  return { rawMessage: text || response.statusText || `HTTP ${response.status}` };
}

async function orgRequest<T>(
  path: string,
  init?: RequestInit & { trackGlobalLoading?: boolean },
): Promise<T> {
  const { trackGlobalLoading, ...fetchInit } = init ?? {};
  const fetchFn = trackGlobalLoading === false ? fetch : trackFetch;
  const token = getAccessToken();
  const response = await fetchFn(`${apiUrl}${path}`, {
    ...fetchInit,
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId(),
      ...getApiLocaleHeaders(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchInit.headers,
    },
  });

  if (!response.ok) {
    const { code, rawMessage } = await readTechnicalErrorMessage(response);
    logTechnicalError(`freelancer-api ${fetchInit.method ?? 'GET'} ${path}`, {
      status: response.status,
      code,
      body: rawMessage,
    });
    throw new AuthRequestError(response.status, rawMessage, code);
  }

  return response.json() as Promise<T>;
}

const profilesBase = '/organizations/me/freelancer-profiles';

export function listFreelancerProfiles(): Promise<FreelancerProfilesListResponse> {
  return orgRequest(profilesBase);
}

export function getFreelancerProfile(profileId: string): Promise<{ profile: FreelancerProfileDto }> {
  return orgRequest(`${profilesBase}/${profileId}`);
}

export function createFreelancerProfile(
  payload: UpdateFreelancerProfilePayload = {},
): Promise<{ profile: FreelancerProfileDto }> {
  return orgRequest(profilesBase, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateFreelancerProfile(
  profileId: string,
  payload: UpdateFreelancerProfilePayload,
): Promise<{ profile: FreelancerProfileDto }> {
  return orgRequest(`${profilesBase}/${profileId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteFreelancerProfile(profileId: string): Promise<{ ok: true }> {
  return orgRequest(`${profilesBase}/${profileId}`, { method: 'DELETE' });
}

export function confirmFreelancerProfileImport(
  label?: string,
): Promise<{ profile: FreelancerProfileDto }> {
  return orgRequest(`${profilesBase}/import/confirm`, {
    method: 'POST',
    body: JSON.stringify(label ? { label } : {}),
  });
}

export function discardFreelancerProfileImport(): Promise<{ ok: true }> {
  return orgRequest(`${profilesBase}/import`, { method: 'DELETE' });
}

export function getSearchFilters(profileId: string): Promise<SearchFiltersResponse> {
  return orgRequest(`${profilesBase}/${profileId}/search-filters`);
}

export function saveSearchFilters(
  profileId: string,
  filters: Record<string, unknown>,
): Promise<SearchFiltersResponse> {
  return orgRequest(`${profilesBase}/${profileId}/search-filters`, {
    method: 'PUT',
    body: JSON.stringify({ filters }),
  });
}

export function generateSearchFilters(profileId: string): Promise<SearchFiltersResponse> {
  return orgRequest(`${profilesBase}/${profileId}/search-filters/generate`, {
    method: 'POST',
    body: '{}',
  });
}

export function createExtensionPairingCode(): Promise<ExtensionPairingCodeResponse> {
  return orgRequest('/organizations/me/extension/pairing-code', { method: 'POST', body: '{}' });
}

export type ScrapeRunDto = Readonly<{
  id: string;
  orgId: string;
  freelancerProfileId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  trigger: 'manual' | 'schedule';
  actorId: string;
  apifyRunId: string | null;
  filtersSnapshot: Record<string, unknown>;
  error: string | null;
  totalFetched: number;
  totalFiltered: number;
  totalSaved: number;
  totalNew: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type UpworkJobDto = Readonly<{
  id: string;
  orgId: string;
  externalJobId: string;
  jobUrl: string;
  title: string;
  description: string;
  budget: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  clientLocation: string | null;
  clientRating: number | null;
  clientSpent: string | null;
  skills: string[];
  proposals: number | null;
  postedTime: string | null;
  postedAt: string | null;
  scrapeRunId: string | null;
  scrapedAt: string;
  relevancyScore: number;
  scoredAt: string;
  freelancerProfileId: string;
  isNewInRun?: boolean | null;
}>;

export type UpworkScoreBreakdownPartDto = Readonly<{
  key: string;
  raw: number;
  weight: number;
  contribution: number;
}>;

export type UpworkSkillMatchDto = Readonly<{
  skill: string;
  matched: boolean;
}>;

export type PaginationMetaDto = Readonly<{
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}>;

export type UpworkScoringConfigDto = Readonly<{
  weights: Readonly<{
    skills: number;
    keywords: number;
    budget: number;
    location: number;
    clientRating: number;
    proposals: number;
  }>;
  thresholds: Readonly<{
    green: number;
    orange: number;
    yellow: number;
  }>;
}>;

export type UpworkOverviewDto = Readonly<{
  extensionConnected: boolean;
  scoringThresholds: UpworkScoringConfigDto['thresholds'];
  pendingDraft: ProfileImportDraftDto | null;
  profiles: ReadonlyArray<{
    id: string;
    label: string | null;
    title: string | null;
    source: string;
    skills: string[];
    updatedAt: string;
  }>;
  recentJobs: ReadonlyArray<{
    id: string;
    title: string;
    jobUrl: string;
    budget: string | null;
    relevancyScore: number;
    scrapedAt: string;
    freelancerProfileId: string;
  }>;
}>;

export function createScrapeRun(profileId: string): Promise<ScrapeRunDto> {
  return orgRequest(`${profilesBase}/${profileId}/scrape-runs`, {
    method: 'POST',
    body: '{}',
  });
}

export function listScrapeRuns(
  profileId: string,
  params?: { page?: number; limit?: number; trackGlobalLoading?: boolean },
): Promise<{ items: ScrapeRunDto[]; meta: PaginationMetaDto }> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  const qs = search.toString();
  return orgRequest(`${profilesBase}/${profileId}/scrape-runs${qs ? `?${qs}` : ''}`, {
    trackGlobalLoading: params?.trackGlobalLoading,
  });
}

export function getScrapeRun(
  profileId: string,
  runId: string,
  options?: { trackGlobalLoading?: boolean },
): Promise<ScrapeRunDto> {
  return orgRequest(`${profilesBase}/${profileId}/scrape-runs/${runId}`, {
    trackGlobalLoading: options?.trackGlobalLoading,
  });
}

export function listUpworkJobs(
  profileId: string,
  params?: {
    page?: number;
    limit?: number;
    q?: string;
    minScore?: number;
    sort?: 'score' | 'date';
    scrapedFrom?: string;
    scrapedTo?: string;
    scrapeRunId?: string;
    newOnly?: boolean;
    trackGlobalLoading?: boolean;
  },
): Promise<{
  items: UpworkJobDto[];
  meta: PaginationMetaDto;
  scoringThresholds: UpworkScoringConfigDto['thresholds'];
}> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.q) search.set('q', params.q);
  if (params?.minScore != null) search.set('minScore', String(params.minScore));
  if (params?.sort) search.set('sort', params.sort);
  if (params?.scrapedFrom) search.set('scrapedFrom', params.scrapedFrom);
  if (params?.scrapedTo) search.set('scrapedTo', params.scrapedTo);
  if (params?.scrapeRunId) search.set('scrapeRunId', params.scrapeRunId);
  if (params?.newOnly) search.set('newOnly', 'true');
  const qs = search.toString();
  return orgRequest(`${profilesBase}/${profileId}/upwork-jobs${qs ? `?${qs}` : ''}`, {
    trackGlobalLoading: params?.trackGlobalLoading,
  });
}

export function getUpworkJob(
  profileId: string,
  jobId: string,
): Promise<
  UpworkJobDto & {
    scoringThresholds: UpworkScoringConfigDto['thresholds'];
    scoreBreakdown: readonly UpworkScoreBreakdownPartDto[];
    skillMatches: readonly UpworkSkillMatchDto[];
  }
> {
  return orgRequest(`${profilesBase}/${profileId}/upwork-jobs/${jobId}`);
}

export function getUpworkScoringConfig(): Promise<UpworkScoringConfigDto> {
  return orgRequest('/organizations/me/upwork/scoring');
}

export function updateUpworkScoringConfig(
  payload: UpworkScoringConfigDto,
): Promise<UpworkScoringConfigDto> {
  return orgRequest('/organizations/me/upwork/scoring', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function resetUpworkScoringConfig(): Promise<UpworkScoringConfigDto> {
  return orgRequest('/organizations/me/upwork/scoring/reset', {
    method: 'PUT',
    body: '{}',
  });
}

export function getUpworkOverview(): Promise<UpworkOverviewDto> {
  return orgRequest('/organizations/me/upwork/overview');
}

export function markExtensionConnected(): Promise<{ ok: true; extensionConnected: true }> {
  return orgRequest('/organizations/me/upwork/extension/mark-connected', {
    method: 'POST',
    body: '{}',
  });
}
