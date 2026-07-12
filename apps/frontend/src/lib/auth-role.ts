import { decodeJwtPayload, getAccessToken } from '@/lib/auth-session';

export function getRoleFromAccessToken(token: string | null): string | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return typeof payload?.role === 'string' ? payload.role : null;
}

export function getCurrentRole(): string | null {
  return getRoleFromAccessToken(getAccessToken());
}
