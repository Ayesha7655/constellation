export const AUTH_SESSION_CHANGE_EVENT = 'constellation:auth-session-change';

const ACCESS_TOKEN_KEY = 'constellation:access-token';
const REFRESH_TOKEN_KEY = 'constellation:refresh-token';
const DASHBOARD_HOME_PATH_KEY = 'constellation:dashboard-home-path';

export type AuthTokens = Readonly<{
  accessToken: string;
  refreshToken: string;
  role?: string;
  dashboardHomePath?: string;
}>;

export function persistAuthSession(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  if (tokens.dashboardHomePath) {
    localStorage.setItem(DASHBOARD_HOME_PATH_KEY, tokens.dashboardHomePath);
  }
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGE_EVENT));
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(DASHBOARD_HOME_PATH_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGE_EVENT));
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getDashboardHomePath(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DASHBOARD_HOME_PATH_KEY);
}

export function isAccessTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return true;
  }
  return payload.exp <= Math.floor(Date.now() / 1000);
}

export function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!base64) return null;
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    );
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}
