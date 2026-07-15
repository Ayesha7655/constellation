/** Target Apify actor for Upwork job search (Plan 2 runs; Plan 1 stores matching input). */
export const APIFY_UPWORK_JOBS_ACTOR_ID = 'blackfalcondata/upwork-scraper' as const;

/**
 * Subset of `blackfalcondata/upwork-scraper` input used by filter generation.
 * @see https://apify.com/blackfalcondata/upwork-scraper
 */
export type UpworkApifySearchFilters = {
  query?: string | string[];
  searchUrl?: string;
  jobType?: 'hourly' | 'fixed' | 'any' | string;
  experienceLevel?: string | string[];
  workload?: string;
  sort?: 'recency' | 'relevance' | string;
  category?: string | string[];
  location?: Array<string | { type: 'COUNTRY' | 'REGION'; value: string }>;
  excludeLocations?: Array<string | { type: 'COUNTRY' | 'REGION'; value: string }>;
  budget?: string;
  hourlyRate?: string;
  duration?: string;
  verifiedPaymentOnly?: boolean;
  proposals?: string;
  maxResults?: number;
  /** Allow extra actor fields without dropping them on save. */
  [key: string]: unknown;
};

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
