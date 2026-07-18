/** Apify actor id from Upwork Jobs Scraper system doc (`getdataforme/upwork-actor`). */
export const APIFY_UPWORK_JOBS_ACTOR_ID = 'XYTgO05GT5qAoSlxy' as const;

/** Human-readable store path for docs / UI. */
export const APIFY_UPWORK_JOBS_ACTOR_NAME = 'getdataforme/upwork-actor' as const;

/**
 * Input for `getdataforme/upwork-actor` (actor id {@link APIFY_UPWORK_JOBS_ACTOR_ID}).
 * @see https://apify.com/getdataforme/upwork-actor
 */
export type UpworkApifyProxyConfiguration = {
  useApifyProxy?: boolean;
  apifyProxyGroups?: string[];
  /** Preferred Apify proxy country code (e.g. `US`). */
  apifyProxyCountry?: string;
  /** Legacy alias some configs use instead of `apifyProxyCountry`. */
  country?: string;
};

export type UpworkApifySearchFilters = {
  /** Search queries / keywords to run on Upwork (required by the actor). */
  queries: string[];
  /** Max jobs to return per query. */
  item_limit?: number;
  /** Only include jobs posted within this many hours. */
  job_posted?: number;
  proxyConfiguration?: UpworkApifyProxyConfiguration;
  /** Allow extra actor fields without dropping them on save. */
  [key: string]: unknown;
};

/** Default client locations excluded during ingest (system doc post-processing). */
export const UPWORK_DEFAULT_EXCLUDED_CLIENT_LOCATIONS = [
  'Pakistan',
  'India',
  'Bangladesh',
  'Nepal',
  'Sri Lanka',
] as const;

/**
 * ISO / Apify short codes that map to {@link UPWORK_DEFAULT_EXCLUDED_CLIENT_LOCATIONS}.
 * Matched as whole tokens only (case-insensitive) so "IN" does not match inside other words.
 */
export const UPWORK_EXCLUDED_CLIENT_LOCATION_CODES = [
  'PK',
  'IND',
  'IN',
  'BD',
  'NP',
  'LK',
] as const;

/** Common Apify / Upwork location labels → canonical lowercase country name. */
const UPWORK_LOCATION_CANONICAL: Readonly<Record<string, string>> = {
  pk: 'pakistan',
  pakistan: 'pakistan',
  ind: 'india',
  in: 'india',
  india: 'india',
  bd: 'bangladesh',
  bangladesh: 'bangladesh',
  np: 'nepal',
  nepal: 'nepal',
  lk: 'sri lanka',
  'sri lanka': 'sri lanka',
  srilanka: 'sri lanka',
  us: 'united states',
  usa: 'united states',
  'united states': 'united states',
  'u.s.': 'united states',
  'u.s.a.': 'united states',
  gb: 'united kingdom',
  uk: 'united kingdom',
  'united kingdom': 'united kingdom',
  ca: 'canada',
  canada: 'canada',
  au: 'australia',
  australia: 'australia',
  de: 'germany',
  germany: 'germany',
  ae: 'united arab emirates',
  uae: 'united arab emirates',
};

/**
 * True when Apify `clientLocation` (full name or short code like `IND`) is in the default exclude list.
 */
export function isExcludedUpworkClientLocation(clientLocation: string | null | undefined): boolean {
  if (!clientLocation?.trim()) return false;
  const raw = clientLocation.trim().toLocaleLowerCase();
  const codeSet = new Set(
    UPWORK_EXCLUDED_CLIENT_LOCATION_CODES.map((code) => code.toLocaleLowerCase()),
  );
  if (codeSet.has(raw)) return true;

  const canonical = UPWORK_LOCATION_CANONICAL[raw] ?? raw;
  return UPWORK_DEFAULT_EXCLUDED_CLIENT_LOCATIONS.some((country) => {
    const name = country.toLocaleLowerCase();
    return canonical === name || raw.includes(name) || name.includes(canonical);
  });
}

/** Normalize a location label/code for equality checks in scoring. */
export function canonicalizeUpworkLocation(location: string | null | undefined): string | null {
  if (!location?.trim()) return null;
  const raw = location.trim().toLocaleLowerCase();
  return UPWORK_LOCATION_CANONICAL[raw] ?? raw;
}

/** Default title/description blacklist keywords (system doc categories). */
export const UPWORK_DEFAULT_BLACKLIST_KEYWORDS = [
  'Content Strategy',
  'SEO',
  'Social Media Marketing',
  'Copywriting',
  'Lead Generation',
  'Digital Marketing',
  'Graphic Design',
  'Logo Design',
  'Figma only',
  'UI/UX only',
  'Data Entry',
  'Virtual Assistant',
  'Transcription',
  'Translation',
  'Research Assistant',
  'WordPress',
  'Wix',
  'Squarespace',
  'AI Video Editor',
  'Video Editing',
  'Accounting',
  'Bookkeeping',
  'Tax Preparation',
] as const;

export const DEFAULT_UPWORK_APIFY_FILTERS: UpworkApifySearchFilters = {
  queries: [],
  item_limit: 100,
  job_posted: 48,
  proxyConfiguration: {
    useApifyProxy: true,
    apifyProxyGroups: ['RESIDENTIAL'],
    apifyProxyCountry: 'US',
  },
};

/**
 * Normalize saved filter JSON (including legacy blackfalcondata shapes) into actor input.
 */
export function normalizeUpworkApifyFilters(
  raw: Record<string, unknown> | null | undefined,
): UpworkApifySearchFilters {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const queriesFromArray = Array.isArray(source.queries)
    ? source.queries.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  let queries = queriesFromArray;
  if (queries.length === 0) {
    const legacy = source.query;
    if (typeof legacy === 'string' && legacy.trim()) {
      queries = [legacy.trim()];
    } else if (Array.isArray(legacy)) {
      queries = legacy.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
  }

  const itemLimitRaw = source.item_limit ?? source.maxResults;
  const item_limit =
    typeof itemLimitRaw === 'number' && Number.isFinite(itemLimitRaw)
      ? Math.min(100, Math.max(1, Math.trunc(itemLimitRaw)))
      : DEFAULT_UPWORK_APIFY_FILTERS.item_limit;

  const jobPostedRaw = source.job_posted;
  const job_posted =
    typeof jobPostedRaw === 'number' && Number.isFinite(jobPostedRaw)
      ? Math.min(168, Math.max(1, Math.trunc(jobPostedRaw)))
      : DEFAULT_UPWORK_APIFY_FILTERS.job_posted;

  const proxyRaw = source.proxyConfiguration;
  const proxyConfiguration =
    proxyRaw && typeof proxyRaw === 'object' && !Array.isArray(proxyRaw)
      ? (proxyRaw as UpworkApifyProxyConfiguration)
      : DEFAULT_UPWORK_APIFY_FILTERS.proxyConfiguration;

  return {
    queries,
    item_limit,
    job_posted,
    proxyConfiguration,
  };
}

export type FreelancerProfileSource = 'manual' | 'extension';

export type OrgFreelancerProfilePayload = {
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
  source: FreelancerProfileSource;
};

export type UpworkFilterGenerationProfile = Pick<
  OrgFreelancerProfilePayload,
  | 'title'
  | 'overview'
  | 'skills'
  | 'hourlyRateMin'
  | 'hourlyRateMax'
  | 'country'
  | 'timezone'
  | 'languages'
  | 'exclusions'
>;

export type GenerateUpworkFiltersRequest = {
  profile: UpworkFilterGenerationProfile;
};

export type GenerateUpworkFiltersResponse = {
  filters: UpworkApifySearchFilters;
};

export type ScrapeRunStatus = 'queued' | 'running' | 'succeeded' | 'failed';
export type ScrapeRunTrigger = 'manual' | 'schedule';

export type ProfileImportMatchReason = 'url' | 'uid';

/**
 * Canonical Upwork freelancer profile URL for match/store.
 * Strips query/hash and trailing slashes; requires `/freelancers/{slug}` (not the listing root).
 */
export function normalizeUpworkFreelancerProfileUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const url = new URL(raw.trim());
    const isUpworkHost = url.hostname === 'upwork.com' || url.hostname.endsWith('.upwork.com');
    if (!isUpworkHost) return null;
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const match = /^\/freelancers\/([^/]+)$/.exec(path);
    const slug = match?.[1];
    if (!slug) return null;
    return `https://www.upwork.com/freelancers/${slug}`;
  } catch {
    return null;
  }
}

export function isUpworkFreelancerProfileUrl(raw: string | null | undefined): boolean {
  return normalizeUpworkFreelancerProfileUrl(raw) !== null;
}

/** Prefer `rawSnapshot.profile.uid` from the Chrome extension scraper. */
export function extractUpworkUidFromRawSnapshot(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const profile = record.profile;
  if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
    const uid = (profile as Record<string, unknown>).uid;
    if (typeof uid === 'string' && uid.trim()) return uid.trim();
  }
  if (typeof record.uid === 'string' && record.uid.trim()) return record.uid.trim();
  return null;
}
