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

async function orgRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const response = await trackFetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId(),
      ...getApiLocaleHeaders(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const { code, rawMessage } = await readTechnicalErrorMessage(response);
    logTechnicalError(`freelancer-api ${init?.method ?? 'GET'} ${path}`, {
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
