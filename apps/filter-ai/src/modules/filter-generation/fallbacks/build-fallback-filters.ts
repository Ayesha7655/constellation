import {
  DEFAULT_UPWORK_APIFY_FILTERS,
  type UpworkApifySearchFilters,
  type UpworkFilterGenerationProfile,
} from '@constellation/shared';

function uniqueTerms(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.toLocaleLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function buildFallbackFilters(profile: UpworkFilterGenerationProfile): UpworkApifySearchFilters {
  const titleTerms = profile.title?.split(/\s+/).filter(Boolean).slice(0, 4) ?? [];
  const excluded = new Set(profile.exclusions.map((term) => term.toLocaleLowerCase()));
  const skillQueries = uniqueTerms(profile.skills.slice(0, 8)).filter(
    (term) => !excluded.has(term.toLocaleLowerCase()),
  );
  const titleQuery = uniqueTerms(titleTerms).join(' ').trim();

  const queries = uniqueTerms([
    ...skillQueries.map((skill) => `${skill} developer`),
    ...(titleQuery ? [titleQuery] : []),
  ]).slice(0, 12);

  return {
    queries: queries.length > 0 ? queries : ['software developer'],
    item_limit: DEFAULT_UPWORK_APIFY_FILTERS.item_limit,
    job_posted: DEFAULT_UPWORK_APIFY_FILTERS.job_posted,
    proxyConfiguration: DEFAULT_UPWORK_APIFY_FILTERS.proxyConfiguration,
  };
}
