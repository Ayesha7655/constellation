import {
  isExcludedUpworkClientLocation,
  UPWORK_DEFAULT_BLACKLIST_KEYWORDS,
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

/** Apify may send skills as `skills` and/or `tags` (current actor shape uses tags). */
function asSkillList(...values: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      if (typeof item !== 'string' || !item.trim()) continue;
      const trimmed = item.trim();
      const key = trimmed.toLocaleLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(trimmed);
    }
  }
  return result;
}

function extractExternalId(url: string, ...candidates: Array<string | null>): string | null {
  // Prefer the canonical id embedded in the Upwork URL (~0… digits).
  const fromUrl = url.match(/~0*(\d+)/)?.[1] ?? url.match(/\/jobs\/[^/_]+_~0*(\d+)/)?.[1];
  if (fromUrl) return fromUrl;

  for (const explicit of candidates) {
    if (!explicit) continue;
    const digits = explicit.replace(/^~0*/, '');
    if (/^\d+$/.test(digits)) return digits;
  }
  return candidates.find((value): value is string => Boolean(value)) ?? null;
}

/** Strip query/hash so the same listing always shares one unique job_url. */
export function normalizeUpworkJobUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = '';
    parsed.hash = '';
    // Keep trailing slash consistency: Upwork job paths often end with /
    return parsed.toString();
  } catch {
    const withoutHash = url.split('#')[0] ?? url;
    const withoutQuery = withoutHash.split('?')[0] ?? withoutHash;
    return withoutQuery.trim();
  }
}

function parsePostedAt(value: unknown): Date | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const fromNumber = new Date(value);
    return Number.isFinite(fromNumber.getTime()) ? fromNumber : null;
  }
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed) : null;
}

/**
 * Normalize Apify dataset items from getdataforme/upwork-actor (and close variants).
 * Current live payloads use: title, url, tags, budget, jobType, clientLocation, clientRating,
 * proposals, absoluteDate, relativeDate, clientTotalSpent — not the older job_title / skills shape.
 */
export function mapApifyJobItem(raw: unknown): NormalizedApifyJob | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const item = raw as Record<string, unknown>;

  const title = asString(item.job_title) ?? asString(item.title);
  const rawJobUrl = asString(item.job_url) ?? asString(item.url);
  if (!title || !rawJobUrl) return null;
  const jobUrl = normalizeUpworkJobUrl(rawJobUrl);

  const externalJobId = extractExternalId(
    jobUrl,
    asString(item.job_uid),
    asString(item.id),
    asString(item.subId),
    asString(item.externalJobId),
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
    clientSpent: asString(
      item.clientSpent ?? item.client_spent ?? item.clientTotalSpent ?? item.client_total_spent,
    ),
    skills: asSkillList(item.skills, item.tags),
    proposals: asInteger(item.proposals),
    postedTime:
      asString(item.posted_time) ?? asString(item.postedTime) ?? asString(item.relativeDate),
    postedAt: parsePostedAt(
      item.postedAt ?? item.posted_at ?? item.absoluteDate ?? item.absolute_date,
    ),
    rawPayload: item,
  };
}

export function shouldExcludeJob(
  job: NormalizedApifyJob,
  profileExclusions: readonly string[] | null | undefined,
): boolean {
  if (isExcludedUpworkClientLocation(job.clientLocation)) {
    return true;
  }

  const haystack = `${job.title}\n${job.description}\n${job.skills.join('\n')}`.toLocaleLowerCase();
  const extras = Array.isArray(profileExclusions) ? profileExclusions : [];
  const blacklist = [...UPWORK_DEFAULT_BLACKLIST_KEYWORDS, ...extras]
    .map((term) => (typeof term === 'string' ? term.toLocaleLowerCase().trim() : ''))
    .filter(Boolean);

  return blacklist.some((term) => haystack.includes(term));
}

/**
 * Prefer persisted skills; if empty (older scrapes before tags→skills mapping), recover from rawPayload.tags.
 */
export function resolveJobSkillLabels(job: {
  skills?: readonly string[] | null;
  rawPayload?: Record<string, unknown> | null;
}): string[] {
  const stored = Array.isArray(job.skills)
    ? job.skills.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  if (stored.length > 0) return stored;

  const raw = job.rawPayload;
  if (!raw || typeof raw !== 'object') return [];
  return asSkillList(raw.skills, raw.tags);
}

