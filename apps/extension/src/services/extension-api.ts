import { getDefaultApiUrl } from '../lib/extension-config';
import { clearSession, ensureDeviceId, getStoredSession, saveSession } from '../lib/extension-storage';
import type { ScrapedProfile, StoredSession } from '../types';

type PairResponse = Readonly<{
  accessToken?: unknown;
  refreshToken?: unknown;
}>;

class ExtensionApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export type ExtensionOperation = 'connect' | 'sync' | 'disconnect';

async function readError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { code?: unknown; message?: unknown } | null;
  if (typeof body?.code === 'string') return body.code;
  if (typeof body?.message === 'string') return body.message;
  return response.statusText || `Request failed (${response.status})`;
}

async function refreshSession(session: StoredSession): Promise<StoredSession | null> {
  const response = await fetch(`${session.apiUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  if (!response.ok) {
    await clearSession();
    return null;
  }

  const body = (await response.json()) as { accessToken?: unknown };
  if (typeof body.accessToken !== 'string') {
    await clearSession();
    return null;
  }

  const refreshed = { ...session, accessToken: body.accessToken };
  await saveSession(refreshed);
  return refreshed;
}

async function authenticatedFetch(
  session: StoredSession,
  path: string,
  init?: RequestInit,
): Promise<{ response: Response; session: StoredSession }> {
  const send = (activeSession: StoredSession) =>
    fetch(`${activeSession.apiUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeSession.accessToken}`,
        'x-device-id': activeSession.deviceId,
        ...init?.headers,
      },
    });

  let activeSession = session;
  let response = await send(activeSession);
  if (response.status === 401) {
    const refreshed = await refreshSession(activeSession);
    if (!refreshed) throw new ExtensionApiError('Your connection expired. Connect again.', 401);
    activeSession = refreshed;
    response = await send(activeSession);
  }

  return { response, session: activeSession };
}

export async function connectWithCode(code: string): Promise<StoredSession> {
  const apiUrl = getDefaultApiUrl();
  const deviceId = await ensureDeviceId();
  const response = await fetch(`${apiUrl}/extension/pair`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': deviceId,
    },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) throw new ExtensionApiError(await readError(response), response.status);

  const body = (await response.json()) as PairResponse;
  if (typeof body.accessToken !== 'string' || typeof body.refreshToken !== 'string') {
    throw new ExtensionApiError('The app returned an invalid connection response.', 500);
  }

  const session = {
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    apiUrl,
    deviceId,
  };
  await saveSession(session);
  return session;
}

export async function restoreValidSession(): Promise<StoredSession | null> {
  const session = await getStoredSession();
  if (!session) return null;

  try {
    const { response, session: activeSession } = await authenticatedFetch(session, '/users/me');
    if (response.ok) return activeSession;
    if (response.status === 401) return null;
    return session;
  } catch {
    return session;
  }
}

export async function disconnect(session: StoredSession): Promise<void> {
  try {
    await fetch(`${session.apiUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
  } catch {
    // Local disconnect must still work when the backend is unavailable.
  } finally {
    await clearSession();
  }
}

export async function importProfileDraft(session: StoredSession, profile: ScrapedProfile): Promise<StoredSession> {
  const result = await authenticatedFetch(session, '/organizations/me/freelancer-profiles/import', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
  if (!result.response.ok) {
    throw new ExtensionApiError(await readError(result.response), result.response.status);
  }
  return result.session;
}

export function isAuthenticationError(error: unknown): boolean {
  return error instanceof ExtensionApiError && error.status === 401;
}

export function toFriendlyError(error: unknown, operation: ExtensionOperation): string {
  if (error instanceof ExtensionApiError) {
    if (operation === 'connect' && error.status === 400) {
      return 'The pairing code is invalid or has already been used.';
    }
    if (error.status === 401) return 'Your connection expired. Connect the extension again.';
    if (operation === 'connect' && error.status === 404) {
      return 'The pairing code was not found or has expired.';
    }
    return error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong. Try again.';
}
