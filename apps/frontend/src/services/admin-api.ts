import { getDeviceId } from '@/lib/device-id';
import { getClientApiLocale } from '@/lib/api-locale';
import { getAccessToken } from '@/lib/auth-session';
import type { AppLocale } from '@/i18n/config';
import { AuthRequestError, logTechnicalError } from '@/lib/user-messages';
import { parseApiErrorResponse } from '@/lib/api-error';
import type { RolesListResponse } from '@/types/admin';
import type {
  AdminUserDetail,
  AdminUserManageableStatus,
  UserFilterRolesResponse,
  UserRoleFilter,
  UserStatusFilter,
  UsersListResponse,
} from '@/types/admin-users';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4050/api';

async function adminRequest<T>(
  path: string,
  init?: RequestInit & { locale?: AppLocale; trackGlobalLoading?: boolean },
): Promise<T> {
  const token = getAccessToken();
  const locale = init?.locale ?? getClientApiLocale();
  const { trackGlobalLoading, locale: _locale, ...fetchInit } = init ?? {};
  const fetchFn = trackGlobalLoading === false ? fetch : async (input: RequestInfo | URL, options?: RequestInit) => {
    const { trackFetch } = await import('@/lib/global-loading');
    return trackFetch(input, options);
  };

  const response = await fetchFn(`${apiUrl}${path}`, {
    ...fetchInit,
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId(),
      'x-locale': locale,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(fetchInit.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    let code: string | undefined;
    try {
      const parsed = parseApiErrorResponse(response.status, JSON.parse(text) as unknown);
      code = parsed.code;
    } catch {
      /* ignore */
    }
    logTechnicalError(`admin-api ${path}`, { status: response.status, code, body: text });
    throw new AuthRequestError(response.status, text || response.statusText, code);
  }

  return response.json() as Promise<T>;
}

export async function listAdminRoles(locale: AppLocale): Promise<RolesListResponse> {
  return adminRequest<RolesListResponse>('/admin/roles', { locale, trackGlobalLoading: false });
}

export async function listUserFilterRoles(locale: AppLocale): Promise<UserFilterRolesResponse> {
  return adminRequest<UserFilterRolesResponse>('/admin/users/roles', { locale, trackGlobalLoading: false });
}

export async function listUsers(params: {
  locale: AppLocale;
  page: number;
  limit: number;
  status?: UserStatusFilter;
  roleKey?: UserRoleFilter;
  q?: string;
}): Promise<UsersListResponse> {
  const search = new URLSearchParams();
  search.set('page', String(params.page));
  search.set('limit', String(params.limit));
  if (params.status && params.status !== 'ALL') {
    search.set('status', params.status);
  }
  if (params.roleKey && params.roleKey !== 'ALL') {
    search.set('roleKey', params.roleKey);
  }
  if (params.q?.trim()) {
    search.set('q', params.q.trim());
  }
  return adminRequest<UsersListResponse>(`/admin/users?${search.toString()}`, {
    locale: params.locale,
    trackGlobalLoading: false,
  });
}

export async function getUser(id: string): Promise<AdminUserDetail> {
  return adminRequest<AdminUserDetail>(`/admin/users/${id}`, { trackGlobalLoading: false });
}

export async function updateUserStatus(id: string, status: AdminUserManageableStatus): Promise<AdminUserDetail> {
  return adminRequest<AdminUserDetail>(`/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
