import type { UpworkApifySearchFilters, UpworkFilterGenerationProfile } from '@constellation/shared';

function uniqueTerms(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.toLocaleLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function buildHourlyRate(profile: UpworkFilterGenerationProfile): string | undefined {
  if (profile.hourlyRateMin != null && profile.hourlyRateMax != null) {
    return `${profile.hourlyRateMin}-${profile.hourlyRateMax}`;
  }
  if (profile.hourlyRateMin != null) {
    return `${profile.hourlyRateMin}-`;
  }
  return undefined;
}

export function buildFallbackFilters(profile: UpworkFilterGenerationProfile): UpworkApifySearchFilters {
  const titleTerms = profile.title?.split(/\s+/).filter(Boolean).slice(0, 4) ?? [];
  const excluded = new Set(profile.exclusions.map((term) => term.toLocaleLowerCase()));
  const queryTerms = uniqueTerms([...profile.skills.slice(0, 5), ...titleTerms]).filter(
    (term) => !excluded.has(term.toLocaleLowerCase()),
  );
  const hourlyRate = buildHourlyRate(profile);

  return {
    query: queryTerms.join(' ') || 'software developer',
    sort: 'recency',
    jobType: 'any',
    verifiedPaymentOnly: true,
    maxResults: 50,
    ...(hourlyRate ? { hourlyRate } : {}),
  };
}
