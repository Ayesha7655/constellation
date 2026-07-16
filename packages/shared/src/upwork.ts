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
  item_limit: 50,
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
export function normalizeUpworkApifyFilters(raw: Record<string, unknown>): UpworkApifySearchFilters {
  const queriesFromArray = Array.isArray(raw.queries)
    ? raw.queries.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  let queries = queriesFromArray;
  if (queries.length === 0) {
    const legacy = raw.query;
    if (typeof legacy === 'string' && legacy.trim()) {
      queries = [legacy.trim()];
    } else if (Array.isArray(legacy)) {
      queries = legacy.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
  }

  const itemLimitRaw = raw.item_limit ?? raw.maxResults;
  const item_limit =
    typeof itemLimitRaw === 'number' && Number.isFinite(itemLimitRaw)
      ? Math.min(100, Math.max(1, Math.trunc(itemLimitRaw)))
      : DEFAULT_UPWORK_APIFY_FILTERS.item_limit;

  const jobPostedRaw = raw.job_posted;
  const job_posted =
    typeof jobPostedRaw === 'number' && Number.isFinite(jobPostedRaw)
      ? Math.min(168, Math.max(1, Math.trunc(jobPostedRaw)))
      : DEFAULT_UPWORK_APIFY_FILTERS.job_posted;

  const proxyRaw = raw.proxyConfiguration;
  const proxyConfiguration =
    proxyRaw && typeof proxyRaw === 'object' && !Array.isArray(proxyRaw)
      ? (proxyRaw as UpworkApifyProxyConfiguration)
      : DEFAULT_UPWORK_APIFY_FILTERS.proxyConfiguration;

  return {
    ...raw,
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
