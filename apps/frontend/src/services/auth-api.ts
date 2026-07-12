import { getDeviceId } from '@/lib/device-id';
import { parseApiErrorResponse } from '@/lib/api-error';
import { getApiLocaleHeaders } from '@/lib/api-locale';
import { getAccessToken, getRefreshToken } from '@/lib/auth-session';
import { trackFetch } from '@/lib/global-loading';
import { AuthRequestError, logTechnicalError } from '@/lib/user-messages';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4050/api';

export type AuthResponse = Readonly<{
  accessToken: string;
  refreshToken: string;
  role: string;
  dashboardHomePath: string;
}>;

export type AuthProvider = 'PASSWORD' | 'GOOGLE' | 'APPLE';

export type UserRoleMembership = Readonly<{
  key: string;
  label: string;
  dashboardHomePath: string;
}>;

export type CurrentUser = Readonly<{
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
  status: string;
  authProvider: AuthProvider;
  orgId: string | null;
  orgName: string | null;
  orgAddress: string | null;
  orgProfileComplete: boolean;
  dashboardHomePath: string;
  role: string;
  roleCode: string;
  activeRoleKey: string;
  primaryRoleCode: string;
  roles: string[];
  roleMemberships: readonly UserRoleMembership[];
  permissions: ReadonlyArray<{
    key: string;
    name: string;
    category: string;
    categoryLabel: string;
    description?: string;
  }>;
}>;

function pickApiError(body: unknown, status: number): { code?: string; rawMessage: string } {
  const parsed = parseApiErrorResponse(status, body);
  return { code: parsed.code, rawMessage: parsed.rawMessage };
}

async function readTechnicalErrorMessage(response: Response): Promise<{ code?: string; rawMessage: string }> {
  const text = await response.text();
  try {
    const json: unknown = JSON.parse(text);
    return pickApiError(json, response.status);
  } catch {
    /* use raw text */
  }
  return { rawMessage: text || response.statusText || `HTTP ${response.status}` };
}

async function authRequest<T>(
  path: string,
  init?: RequestInit & { auth?: boolean; trackGlobalLoading?: boolean },
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-device-id': getDeviceId(),
    ...getApiLocaleHeaders(),
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (init?.auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const { trackGlobalLoading, ...fetchInit } = init ?? {};
  delete (fetchInit as { auth?: boolean }).auth;
  const fetchFn = trackGlobalLoading === false ? fetch : trackFetch;
  const response = await fetchFn(`${apiUrl}${path}`, {
    ...fetchInit,
    headers,
  });

  if (!response.ok) {
    const { code, rawMessage } = await readTechnicalErrorMessage(response);
    logTechnicalError(`auth-api ${path}`, {
      status: response.status,
      code,
      body: rawMessage,
    });
    throw new AuthRequestError(response.status, rawMessage, code);
  }

  return response.json() as Promise<T>;
}

export async function firebaseLogin(params: {
  idToken: string;
  name?: string;
}): Promise<AuthResponse> {
  return authRequest<AuthResponse>('/auth/firebase', {
    method: 'POST',
    body: JSON.stringify({
      idToken: params.idToken,
      ...(params.name ? { name: params.name } : {}),
    }),
  });
}

export async function refreshAccessToken(): Promise<{ accessToken: string }> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    logTechnicalError('auth-api refresh', 'No refresh token in storage');
    throw new AuthRequestError(401, 'invalid refresh token');
  }
  return authRequest<{ accessToken: string }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logout(): Promise<{ serverRevoked: boolean }> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    logTechnicalError('auth-api logout', 'No refresh token in storage');
    return { serverRevoked: false };
  }
  try {
    const accessToken = getAccessToken();
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    await authRequest('/auth/logout', {
      method: 'POST',
      headers,
      body: JSON.stringify({ refreshToken }),
    });
    return { serverRevoked: true };
  } catch (error) {
    logTechnicalError('auth-api logout', error);
    return { serverRevoked: false };
  }
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return authRequest<CurrentUser>('/users/me', { auth: true });
}

export async function probeAuthSession(): Promise<CurrentUser | null> {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  const response = await fetch(`${apiUrl}/users/me`, {
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId(),
      ...getApiLocaleHeaders(),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const { code, rawMessage } = await readTechnicalErrorMessage(response);
    logTechnicalError('auth-api /users/me', {
      status: response.status,
      code,
      body: rawMessage,
    });
    throw new AuthRequestError(response.status, rawMessage, code);
  }

  return response.json() as Promise<CurrentUser>;
}

export type AuthCodeResponse = Readonly<{ code: string }>;

export async function requestPasswordReset(email: string): Promise<AuthCodeResponse> {
  return authRequest<AuthCodeResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() }),
  });
}

export async function resetPassword(params: {
  oobCode: string;
  password: string;
}): Promise<AuthCodeResponse> {
  return authRequest<AuthCodeResponse>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      oobCode: params.oobCode,
      password: params.password,
    }),
  });
}

export type SessionPlatform = 'WEB' | 'ANDROID' | 'IOS';

export type SessionItem = Readonly<{
  id: string;
  deviceId: string | null;
  platform: SessionPlatform;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}>;

export type SessionListResponse = Readonly<{ sessions: SessionItem[] }>;

export type RevokeSessionsResponse = Readonly<{
  revokedCount: number;
  revokedAllOtherSessions: boolean;
  code: string;
}>;

export async function updateMyProfile(input: { name?: string }): Promise<CurrentUser> {
  return authRequest<CurrentUser>('/users/me', {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify(input),
  });
}

export async function changeMyPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<AuthCodeResponse> {
  return authRequest<AuthCodeResponse>('/auth/change-password', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(input),
  });
}

export async function getMySessions(): Promise<SessionListResponse> {
  return authRequest<SessionListResponse>('/auth/sessions', { auth: true, trackGlobalLoading: false });
}

export async function revokeMySessions(sessionIds: string[]): Promise<RevokeSessionsResponse> {
  return authRequest<RevokeSessionsResponse>('/auth/sessions/revoke', {
    method: 'POST',
    auth: true,
    trackGlobalLoading: false,
    body: JSON.stringify({ sessionIds }),
  });
}

export async function sendVerificationEmail(email: string): Promise<AuthCodeResponse> {
  return authRequest<AuthCodeResponse>('/auth/send-verification', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() }),
  });
}

export async function verifyEmail(
  oobCode: string,
  email?: string,
): Promise<AuthCodeResponse> {
  return authRequest<AuthCodeResponse>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({
      oobCode,
      ...(email ? { email } : {}),
    }),
  });
}
