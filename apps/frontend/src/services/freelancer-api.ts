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
}>;

export type ProfileImportDraftDto = Readonly<{
  id: string;
  payload: Record<string, unknown>;
  expiresAt: string;
}>;

export type FreelancerProfileResponse = Readonly<{
  profile: FreelancerProfileDto | null;
  pendingDraft: ProfileImportDraftDto | null;
}>;

export type SearchFiltersResponse = Readonly<{
  id?: string;
  orgId?: string;
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

export function getFreelancerProfile(): Promise<FreelancerProfileResponse> {
  return orgRequest('/organizations/me/freelancer-profile');
}

export function updateFreelancerProfile(
  payload: UpdateFreelancerProfilePayload,
): Promise<{ profile: FreelancerProfileDto }> {
  return orgRequest('/organizations/me/freelancer-profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function confirmFreelancerProfileImport(): Promise<{ profile: FreelancerProfileDto }> {
  return orgRequest('/organizations/me/freelancer-profile/import/confirm', { method: 'POST', body: '{}' });
}

export function discardFreelancerProfileImport(): Promise<{ ok: true }> {
  return orgRequest('/organizations/me/freelancer-profile/import', { method: 'DELETE' });
}

export function getSearchFilters(): Promise<SearchFiltersResponse> {
  return orgRequest('/organizations/me/search-filters');
}

export function saveSearchFilters(filters: Record<string, unknown>): Promise<SearchFiltersResponse> {
  return orgRequest('/organizations/me/search-filters', {
    method: 'PUT',
    body: JSON.stringify({ filters }),
  });
}

export function generateSearchFilters(): Promise<SearchFiltersResponse> {
  return orgRequest('/organizations/me/search-filters/generate', { method: 'POST', body: '{}' });
}

export function createExtensionPairingCode(): Promise<ExtensionPairingCodeResponse> {
  return orgRequest('/organizations/me/extension/pairing-code', { method: 'POST', body: '{}' });
}
