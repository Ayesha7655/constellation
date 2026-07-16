import {
  UPWORK_DEFAULT_BLACKLIST_KEYWORDS,
  UPWORK_DEFAULT_EXCLUDED_CLIENT_LOCATIONS,
} from '@constellation/shared';

export type NormalizedApifyJob = Readonly<{
  externalJobId: string;
  jobUrl: string;
  title: string;
  description: string;
  budget: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  clientLocation: string | null;
  clientRating: number | null;
  clientSpent: string | null;
  skills: string[];
  proposals: number | null;
  postedTime: string | null;
  postedAt: Date | null;
  rawPayload: Record<string, unknown>;
}>;

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asInteger(value: unknown): number | null {
  const num = asNumber(value);
  return num == null ? null : Math.trunc(num);
}

function asSkills(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function extractExternalId(url: string, explicit: string | null): string | null {
  if (explicit) return explicit;
  const match = url.match(/~0*(\d+)/) ?? url.match(/\/jobs\/[^/_]+_~0*(\d+)/);
  return match?.[1] ?? null;
}

function parsePostedAt(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed) : null;
}

export function mapApifyJobItem(raw: unknown): NormalizedApifyJob | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const item = raw as Record<string, unknown>;

  const title = asString(item.job_title) ?? asString(item.title);
  const jobUrl = asString(item.job_url) ?? asString(item.url);
  if (!title || !jobUrl) return null;

  const externalJobId = extractExternalId(
    jobUrl,
    asString(item.job_uid) ?? asString(item.externalJobId) ?? asString(item.id),
  );
  if (!externalJobId) return null;

  const budgetValue = item.budget ?? item.budgetAmount ?? item.amount;
  const budget =
    typeof budgetValue === 'string' || typeof budgetValue === 'number'
      ? asString(budgetValue)
      : null;

  return {
    externalJobId,
    jobUrl,
    title,
    description: asString(item.job_description) ?? asString(item.description) ?? '',
    budget,
    jobType: asString(item.job_type) ?? asString(item.jobType),
    experienceLevel: asString(item.experience_level) ?? asString(item.experienceLevel),
    clientLocation: asString(item.clientLocation) ?? asString(item.client_location),
    clientRating: asNumber(item.clientRating ?? item.client_rating),
    clientSpent: asString(item.clientSpent ?? item.client_spent),
    skills: asSkills(item.skills),
    proposals: asInteger(item.proposals),
    postedTime: asString(item.posted_time) ?? asString(item.postedTime),
    postedAt: parsePostedAt(item.postedAt ?? item.posted_at),
    rawPayload: item,
  };
}

export function shouldExcludeJob(
  job: NormalizedApifyJob,
  profileExclusions: readonly string[],
): boolean {
  const location = job.clientLocation?.toLocaleLowerCase() ?? '';
  if (
    location &&
    UPWORK_DEFAULT_EXCLUDED_CLIENT_LOCATIONS.some((country) =>
      location.includes(country.toLocaleLowerCase()),
    )
  ) {
    return true;
  }

  const haystack = `${job.title}\n${job.description}`.toLocaleLowerCase();
  const blacklist = [
    ...UPWORK_DEFAULT_BLACKLIST_KEYWORDS,
    ...profileExclusions,
  ].map((term) => term.toLocaleLowerCase().trim()).filter(Boolean);

  return blacklist.some((term) => haystack.includes(term));
}
