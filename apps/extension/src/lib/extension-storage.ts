import { getDefaultApiUrl } from './extension-config';
import type { ExtensionTheme, StoredSession } from '../types';

type StoredValues = Partial<StoredSession>;

const SESSION_KEYS: (keyof StoredSession)[] = ['accessToken', 'refreshToken', 'apiUrl', 'deviceId'];
const THEME_KEY = 'theme';
const DEFAULT_PROFILE_KEY = 'defaultFreelancerProfileId';

export async function getStoredSession(): Promise<StoredSession | null> {
  const values = (await chrome.storage.local.get(SESSION_KEYS)) as StoredValues;
  if (!values.accessToken || !values.refreshToken) return null;

  return {
    accessToken: values.accessToken,
    refreshToken: values.refreshToken,
    apiUrl: values.apiUrl || getDefaultApiUrl(),
    deviceId: values.deviceId || (await ensureDeviceId()),
  };
}

export async function ensureDeviceId(): Promise<string> {
  const { deviceId } = (await chrome.storage.local.get('deviceId')) as Pick<StoredValues, 'deviceId'>;
  if (deviceId) return deviceId;

  const nextDeviceId = crypto.randomUUID();
  await chrome.storage.local.set({ deviceId: nextDeviceId });
  return nextDeviceId;
}

export async function saveSession(session: StoredSession): Promise<void> {
  await chrome.storage.local.set(session);
}

export async function clearSession(): Promise<void> {
  await chrome.storage.local.remove(['accessToken', 'refreshToken', 'apiUrl']);
}

export async function getStoredTheme(): Promise<ExtensionTheme | null> {
  const value = (await chrome.storage.local.get(THEME_KEY))[THEME_KEY];
  return value === 'light' || value === 'dark' ? value : null;
}

export async function saveTheme(theme: ExtensionTheme): Promise<void> {
  await chrome.storage.local.set({ [THEME_KEY]: theme });
}

export async function getStoredDefaultProfileId(): Promise<string | null> {
  const value = (await chrome.storage.local.get(DEFAULT_PROFILE_KEY))[DEFAULT_PROFILE_KEY];
  return typeof value === 'string' && value.trim() ? value : null;
}

export async function saveDefaultProfileId(profileId: string): Promise<void> {
  await chrome.storage.local.set({ [DEFAULT_PROFILE_KEY]: profileId });
}

export async function clearDefaultProfileId(): Promise<void> {
  await chrome.storage.local.remove([DEFAULT_PROFILE_KEY]);
}
