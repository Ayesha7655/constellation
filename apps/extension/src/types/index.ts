export type ExtensionConfig = Readonly<{
  API_URL?: string;
  WEB_URL?: string;
  EXTENSION_ID?: string;
}>;

export type StoredSession = Readonly<{
  accessToken: string;
  refreshToken: string;
  apiUrl: string;
  deviceId: string;
}>;

export type ScrapedProfile = Readonly<{
  title: string | null;
  overview: string | null;
  skills: string[];
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  country: string | null;
  timezone: string | null;
  languages: string[];
  exclusions: string[];
  profileUrl: string;
  rawSnapshot: Record<string, unknown>;
}>;

export type FreelancerProfileSummary = Readonly<{
  id: string;
  label: string | null;
  title: string | null;
  profileUrl: string | null;
  updatedAt: string;
  source: string;
}>;

export type ImportDraftResult = Readonly<{
  session: StoredSession;
  targetProfileId: string | null;
  matchReason: 'url' | 'uid' | null;
}>;

export type Feedback = Readonly<{
  tone: 'success' | 'error' | 'info';
  message: string;
}>;

export type ExtensionTheme = 'light' | 'dark';

export type ExtensionAction = 'idle' | 'connecting' | 'syncing' | 'disconnecting';

export type ConnectionState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'disconnected' }>
  | Readonly<{ status: 'connected'; session: StoredSession }>;

declare global {
  var CONSTELLATION_EXTENSION_CONFIG: ExtensionConfig | undefined;
}
