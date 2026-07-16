import {
  resolveUpworkScoringConfig,
  sumUpworkScoringWeights,
  UPWORK_SCORING_WEIGHT_KEYS,
  type UpworkScoringConfig,
  type UpworkScoringWeightKey,
  type UpworkScoringWeights,
} from '@constellation/shared';

export type ScoreableProfile = Readonly<{
  title: string | null;
  overview: string | null;
  skills: readonly string[];
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  country: string | null;
  exclusions: readonly string[];
}>;

export type ScoreableJob = Readonly<{
  title: string;
  description: string;
  skills: readonly string[];
  budget: string | null;
  jobType: string | null;
  clientLocation: string | null;
  clientRating: number | null;
  proposals: number | null;
}>;

export type ScoreBreakdownPart = Readonly<{
  key: UpworkScoringWeightKey;
  raw: number;
  weight: number;
  contribution: number;
}>;

export type ScoreResult = Readonly<{
  score: number;
  breakdown: readonly ScoreBreakdownPart[];
}>;

function tokenize(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .split(/[^a-z0-9+#.]/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function uniqueNormalized(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.toLocaleLowerCase().trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function parseBudgetNumbers(budget: string | null): number[] {
  if (!budget) return [];
  const matches = budget.match(/\d+(?:\.\d+)?/g);
  if (!matches) return [];
  return matches
    .map((part) => Number.parseFloat(part))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function skillOverlapScore(profile: ScoreableProfile, job: ScoreableJob): number {
  const profileSkills = uniqueNormalized(profile.skills);
  if (profileSkills.length === 0) return 0.5;
  const jobSkills = uniqueNormalized(job.skills);
  const jobText = `${job.title} ${job.description}`.toLocaleLowerCase();
  const overlap = profileSkills.filter((skill) => {
    if (jobSkills.includes(skill)) return true;
    return jobText.includes(skill);
  }).length;
  return overlap / profileSkills.length;
}

function keywordScore(profile: ScoreableProfile, job: ScoreableJob): number {
  const jobTokens = new Set(tokenize(`${job.title} ${job.description} ${job.skills.join(' ')}`));
  const titleTokens = uniqueNormalized([
    ...tokenize(profile.title ?? ''),
    ...tokenize((profile.overview ?? '').slice(0, 400)),
  ]).slice(0, 24);
  if (titleTokens.length === 0) return 0.5;
  const hits = titleTokens.filter((token) => jobTokens.has(token)).length;
  return hits / titleTokens.length;
}

function budgetFitScore(profile: ScoreableProfile, job: ScoreableJob): number {
  const amounts = parseBudgetNumbers(job.budget);
  const min = profile.hourlyRateMin;
  const max = profile.hourlyRateMax;
  if (amounts.length === 0 || (min == null && max == null)) return 0.5;

  const jobRate = amounts[0] ?? 0;
  if (min != null && max != null) {
    if (jobRate >= min && jobRate <= max) return 1;
    if (jobRate >= min * 0.7 && jobRate <= max * 1.3) return 0.7;
    return 0.25;
  }
  if (min != null) {
    return jobRate >= min * 0.8 ? 1 : jobRate >= min * 0.5 ? 0.6 : 0.2;
  }
  if (max != null) {
    return jobRate <= max * 1.2 ? 1 : 0.3;
  }
  return 0.5;
}

function locationScore(profile: ScoreableProfile, job: ScoreableJob): number {
  const country = profile.country?.trim().toLocaleLowerCase();
  const location = job.clientLocation?.trim().toLocaleLowerCase();
  if (!country || !location) return 0.5;
  if (location.includes(country) || country.includes(location)) return 1;
  const countryTokens = tokenize(country);
  if (countryTokens.some((token) => location.includes(token))) return 0.85;
  return 0.2;
}

function clientRatingScore(job: ScoreableJob): number {
  if (job.clientRating == null || !Number.isFinite(job.clientRating)) return 0.5;
  const clamped = Math.max(0, Math.min(5, job.clientRating));
  return clamped / 5;
}

/** Fewer proposals → higher score (less competition). */
function proposalsScore(job: ScoreableJob): number {
  if (job.proposals == null || !Number.isFinite(job.proposals)) return 0.5;
  const count = Math.max(0, job.proposals);
  if (count <= 5) return 1;
  if (count <= 15) return 0.75;
  if (count <= 30) return 0.5;
  if (count <= 50) return 0.3;
  return 0.15;
}

function normalizedWeightFractions(weights: UpworkScoringWeights): UpworkScoringWeights {
  const total = sumUpworkScoringWeights(weights);
  if (total <= 0) {
    return {
      skills: 0,
      keywords: 0,
      budget: 0,
      location: 0,
      clientRating: 0,
      proposals: 0,
    };
  }
  return {
    skills: weights.skills / total,
    keywords: weights.keywords / total,
    budget: weights.budget / total,
    location: weights.location / total,
    clientRating: weights.clientRating / total,
    proposals: weights.proposals / total,
  };
}

/**
 * Algorithmic relevancy 0–100 using org-configurable weights.
 * Hard exclusion → 0. Missing signals use a neutral 0.5 so zeroed weights stay inert.
 */
export function scoreJobAgainstProfile(
  profile: ScoreableProfile,
  job: ScoreableJob,
  configInput?: UpworkScoringConfig | unknown,
): ScoreResult {
  const config = resolveUpworkScoringConfig(configInput ?? null);
  const jobText = `${job.title} ${job.description}`.toLocaleLowerCase();
  const exclusions = uniqueNormalized(profile.exclusions);
  if (exclusions.some((term) => jobText.includes(term))) {
    return {
      score: 0,
      breakdown: UPWORK_SCORING_WEIGHT_KEYS.map((key) => ({
        key,
        raw: 0,
        weight: config.weights[key],
        contribution: 0,
      })),
    };
  }

  const fractions = normalizedWeightFractions(config.weights);
  const parts: Record<UpworkScoringWeightKey, number> = {
    skills: skillOverlapScore(profile, job),
    keywords: keywordScore(profile, job),
    budget: budgetFitScore(profile, job),
    location: locationScore(profile, job),
    clientRating: clientRatingScore(job),
    proposals: proposalsScore(job),
  };

  const breakdown = UPWORK_SCORING_WEIGHT_KEYS.map((key) => {
    const contribution = parts[key] * fractions[key] * 100;
    return {
      key,
      raw: parts[key],
      weight: config.weights[key],
      contribution: Math.round(contribution * 10) / 10,
    };
  });

  const weighted = breakdown.reduce((sum, part) => sum + part.contribution, 0);
  return {
    score: Math.max(0, Math.min(100, Math.round(weighted))),
    breakdown,
  };
}
