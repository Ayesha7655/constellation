/**
 * Org-configurable Upwork job relevancy scoring (weights + color bands).
 * Stored as JSONB on `organizations.upwork_scoring_config`; null → defaults.
 */

export const UPWORK_SCORING_WEIGHT_KEYS = [
  'skills',
  'keywords',
  'budget',
  'location',
  'clientRating',
  'proposals',
] as const;

export type UpworkScoringWeightKey = (typeof UPWORK_SCORING_WEIGHT_KEYS)[number];

export type UpworkScoringWeights = Readonly<Record<UpworkScoringWeightKey, number>>;

export type UpworkScoringThresholds = Readonly<{
  /** Score ≥ this → green */
  green: number;
  /** Score ≥ this (and &lt; green) → orange */
  orange: number;
  /** Score ≥ this (and &lt; orange) → yellow; below → red */
  yellow: number;
}>;

export type UpworkScoringConfig = Readonly<{
  weights: UpworkScoringWeights;
  thresholds: UpworkScoringThresholds;
}>;

export type UpworkRelevancyBand = 'green' | 'orange' | 'yellow' | 'red';

/** Default weights sum to 100. */
export const DEFAULT_UPWORK_SCORING_WEIGHTS: UpworkScoringWeights = {
  skills: 40,
  keywords: 25,
  budget: 15,
  location: 10,
  clientRating: 5,
  proposals: 5,
};

export const DEFAULT_UPWORK_SCORING_THRESHOLDS: UpworkScoringThresholds = {
  green: 80,
  orange: 60,
  yellow: 40,
};

export const DEFAULT_UPWORK_SCORING_CONFIG: UpworkScoringConfig = {
  weights: DEFAULT_UPWORK_SCORING_WEIGHTS,
  thresholds: DEFAULT_UPWORK_SCORING_THRESHOLDS,
};

function asWeight(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function asThreshold(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Coerce unknown DB/API JSON into a full config (defaults for missing keys).
 * Does not enforce weight sum or threshold ordering — callers validate on write.
 */
export function resolveUpworkScoringConfig(raw: unknown): UpworkScoringConfig {
  const source =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const weightsRaw =
    source.weights && typeof source.weights === 'object' && !Array.isArray(source.weights)
      ? (source.weights as Record<string, unknown>)
      : {};
  const thresholdsRaw =
    source.thresholds && typeof source.thresholds === 'object' && !Array.isArray(source.thresholds)
      ? (source.thresholds as Record<string, unknown>)
      : {};

  return {
    weights: {
      skills: asWeight(weightsRaw.skills, DEFAULT_UPWORK_SCORING_WEIGHTS.skills),
      keywords: asWeight(weightsRaw.keywords, DEFAULT_UPWORK_SCORING_WEIGHTS.keywords),
      budget: asWeight(weightsRaw.budget, DEFAULT_UPWORK_SCORING_WEIGHTS.budget),
      location: asWeight(weightsRaw.location, DEFAULT_UPWORK_SCORING_WEIGHTS.location),
      clientRating: asWeight(weightsRaw.clientRating, DEFAULT_UPWORK_SCORING_WEIGHTS.clientRating),
      proposals: asWeight(weightsRaw.proposals, DEFAULT_UPWORK_SCORING_WEIGHTS.proposals),
    },
    thresholds: {
      green: asThreshold(thresholdsRaw.green, DEFAULT_UPWORK_SCORING_THRESHOLDS.green),
      orange: asThreshold(thresholdsRaw.orange, DEFAULT_UPWORK_SCORING_THRESHOLDS.orange),
      yellow: asThreshold(thresholdsRaw.yellow, DEFAULT_UPWORK_SCORING_THRESHOLDS.yellow),
    },
  };
}

export function sumUpworkScoringWeights(weights: UpworkScoringWeights): number {
  return UPWORK_SCORING_WEIGHT_KEYS.reduce((sum, key) => sum + weights[key], 0);
}

export function isValidUpworkScoringThresholds(thresholds: UpworkScoringThresholds): boolean {
  return (
    thresholds.green >= 0 &&
    thresholds.green <= 100 &&
    thresholds.orange >= 0 &&
    thresholds.orange <= 100 &&
    thresholds.yellow >= 0 &&
    thresholds.yellow <= 100 &&
    thresholds.green > thresholds.orange &&
    thresholds.orange > thresholds.yellow
  );
}

export function resolveUpworkRelevancyBand(
  score: number,
  thresholds: UpworkScoringThresholds = DEFAULT_UPWORK_SCORING_THRESHOLDS,
): UpworkRelevancyBand {
  const safe = Number.isFinite(score) ? score : 0;
  if (safe >= thresholds.green) return 'green';
  if (safe >= thresholds.orange) return 'orange';
  if (safe >= thresholds.yellow) return 'yellow';
  return 'red';
}
