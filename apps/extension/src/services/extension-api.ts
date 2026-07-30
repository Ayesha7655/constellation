import type { ScrapedPortfolioProject } from '../lib/active-tab';
import { getDefaultApiUrl } from '../lib/extension-config';
import { clearSession, ensureDeviceId, getStoredSession, saveSession } from '../lib/extension-storage';
import type {
  FreelancerProfileSummary,
  ImportDraftResult,
  ScrapedProfile,
  StoredSession,
} from '../types';

type PairResponse = Readonly<{
  accessToken?: unknown;
  refreshToken?: unknown;
}>;

export class ExtensionApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

export type ExtensionOperation = 'connect' | 'sync' | 'disconnect' | 'generate' | 'syncPortfolio';

async function readError(response: Response): Promise<{ message: string; code?: string }> {
  const body = (await response.json().catch(() => null)) as { code?: unknown; message?: unknown } | null;
  const code = typeof body?.code === 'string' ? body.code : undefined;
  if (code) return { message: code, code };
  if (typeof body?.message === 'string') return { message: body.message, code };
  return { message: response.statusText || `Request failed (${response.status})` };
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
  if (!response.ok) {
    const err = await readError(response);
    throw new ExtensionApiError(err.message, response.status, err.code);
  }

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

export async function listFreelancerProfiles(
  session: StoredSession,
): Promise<{ session: StoredSession; profiles: FreelancerProfileSummary[] }> {
  const result = await authenticatedFetch(session, '/organizations/me/freelancer-profiles');
  if (!result.response.ok) {
    const err = await readError(result.response);
    throw new ExtensionApiError(err.message, result.response.status, err.code);
  }

  const body = (await result.response.json()) as { profiles?: unknown };
  const profiles = Array.isArray(body.profiles)
    ? body.profiles.flatMap((row): FreelancerProfileSummary[] => {
        if (!row || typeof row !== 'object') return [];
        const item = row as Record<string, unknown>;
        if (typeof item.id !== 'string') return [];
        return [
          {
            id: item.id,
            label: typeof item.label === 'string' ? item.label : null,
            title: typeof item.title === 'string' ? item.title : null,
            profileUrl: typeof item.profileUrl === 'string' ? item.profileUrl : null,
            updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : '',
            source: typeof item.source === 'string' ? item.source : '',
          },
        ];
      })
    : [];

  return { session: result.session, profiles };
}

export async function generateProposalFromJobUrl(
  session: StoredSession,
  profileId: string,
  jobUrl: string,
): Promise<{ session: StoredSession; body: string }> {
  const result = await authenticatedFetch(
    session,
    `/organizations/me/freelancer-profiles/${profileId}/proposal-draft/generate-from-job-url`,
    {
      method: 'POST',
      body: JSON.stringify({ jobUrl }),
    },
  );
  if (!result.response.ok) {
    const err = await readError(result.response);
    throw new ExtensionApiError(err.message, result.response.status, err.code);
  }

  const body = (await result.response.json()) as { draft?: { body?: unknown } };
  const proposalBody = typeof body.draft?.body === 'string' ? body.draft.body.trim() : '';
  if (!proposalBody) {
    throw new ExtensionApiError('api.proposal.generate_failed', 502, 'api.proposal.generate_failed');
  }

  return { session: result.session, body: proposalBody };
}

export async function importProfileDraft(
  session: StoredSession,
  profile: ScrapedProfile,
): Promise<ImportDraftResult> {
  const result = await authenticatedFetch(session, '/organizations/me/freelancer-profiles/import', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
  if (!result.response.ok) {
    const err = await readError(result.response);
    throw new ExtensionApiError(err.message, result.response.status, err.code);
  }

  const body = (await result.response.json()) as {
    targetProfileId?: unknown;
    matchReason?: unknown;
  };

  return {
    session: result.session,
    targetProfileId: typeof body.targetProfileId === 'string' ? body.targetProfileId : null,
    matchReason:
      body.matchReason === 'url' || body.matchReason === 'uid' ? body.matchReason : null,
  };
}

export async function importPortfolioProject(
  session: StoredSession,
  project: ScrapedPortfolioProject,
): Promise<{ session: StoredSession; created: boolean; title: string }> {
  const path = '/organizations/me/portfolio-projects/import';
  console.info('[constellation:portfolio] api import request', {
    apiUrl: session.apiUrl,
    path,
    externalId: project.externalId,
    profileUrl: project.profileUrl,
    projectUrl: project.projectUrl,
    title: project.title,
  });
  let result: { response: Response; session: StoredSession };
  try {
    result = await authenticatedFetch(session, path, {
      method: 'POST',
      body: JSON.stringify(project),
    });
  } catch (error) {
    console.error('[constellation:portfolio] api import transport failed', {
      apiUrl: session.apiUrl,
      path,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
  if (!result.response.ok) {
    const err = await readError(result.response);
    console.error('[constellation:portfolio] api import rejected', {
      apiUrl: result.session.apiUrl,
      path,
      status: result.response.status,
      code: err.code,
      message: err.message,
    });
    throw new ExtensionApiError(err.message, result.response.status, err.code);
  }

  const body = (await result.response.json()) as {
    created?: unknown;
    project?: { title?: unknown };
  };

  console.info('[constellation:portfolio] api import response', {
    status: result.response.status,
    created: body.created === true,
    title: typeof body.project?.title === 'string' ? body.project.title : project.title,
  });

  return {
    session: result.session,
    created: body.created === true,
    title: typeof body.project?.title === 'string' ? body.project.title : project.title,
  };
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
    if (
      operation === 'sync' &&
      (error.code === 'api.freelancer_profile.import_invalid' ||
        error.message === 'api.freelancer_profile.import_invalid')
    ) {
      return 'Not a valid Upwork profile page.';
    }
    if (
      operation === 'syncPortfolio' &&
      (error.code === 'api.portfolio_project.profile_required' ||
        error.message === 'api.portfolio_project.profile_required')
    ) {
      return 'Import this freelancer profile into Constellation first, then sync the portfolio project.';
    }
    if (
      operation === 'syncPortfolio' &&
      (error.code === 'api.portfolio_project.import_invalid' ||
        error.message === 'api.portfolio_project.import_invalid')
    ) {
      return 'Could not read this portfolio project. Open the project modal and try again.';
    }
    if (
      operation === 'generate' &&
      (error.code === 'api.upwork_job.not_in_library' || error.message === 'api.upwork_job.not_in_library')
    ) {
      return 'This job is not in Constellation yet. Run a job search for your profile first.';
    }
    if (
      operation === 'generate' &&
      (error.code === 'api.proposal.invalid_job_url' || error.message === 'api.proposal.invalid_job_url')
    ) {
      return 'Open a valid Upwork job page, then try again.';
    }
    if (
      operation === 'generate' &&
      (error.code === 'api.proposal.generate_failed' || error.message === 'api.proposal.generate_failed')
    ) {
      return 'Could not generate a proposal. Try again.';
    }
    return error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong. Try again.';
}
