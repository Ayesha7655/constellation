import { getDeviceId } from '@/lib/device-id';
import { getApiLocaleHeaders } from '@/lib/api-locale';
import { getAccessToken } from '@/lib/auth-session';
import { parseApiErrorResponse } from '@/lib/api-error';
import { trackFetch } from '@/lib/global-loading';
import { AuthRequestError, logTechnicalError } from '@/lib/user-messages';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4050/api';

export type UpdateOrganizationProfilePayload = Readonly<{
  name: string;
  address: string;
}>;

export type OrganizationProfileResponse = Readonly<{
  orgId: string;
  orgName: string;
  orgAddress: string;
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

export async function updateOrganizationProfile(
  payload: UpdateOrganizationProfilePayload,
): Promise<OrganizationProfileResponse> {
  const token = getAccessToken();
  const response = await trackFetch(`${apiUrl}/organizations/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId(),
      ...getApiLocaleHeaders(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const { code, rawMessage } = await readTechnicalErrorMessage(response);
    logTechnicalError('organizations-api PATCH /organizations/me', {
      status: response.status,
      code,
      body: rawMessage,
    });
    throw new AuthRequestError(response.status, rawMessage, code);
  }

  return response.json() as Promise<OrganizationProfileResponse>;
}
