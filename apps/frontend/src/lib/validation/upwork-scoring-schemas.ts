import { z } from 'zod';
import { UPWORK_SCORING_WEIGHT_KEYS } from '@constellation/shared';
import { formatUpworkScoreOutOfTen } from '@/lib/upwork-score-display';
import { requiredText } from '@/lib/validation/form-fields';

/** Form values are on a 0–10 scale; API still uses 0–100. */
const SCALE = 10;

function parseScoreField(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function toApiScale(value: number): number {
  return Math.round(value * SCALE);
}

function fromApiScale(value: number): string {
  return formatUpworkScoreOutOfTen(value);
}

const weightOrThreshold = (requiredMessage: string, rangeMessage: string) =>
  requiredText(requiredMessage).refine((value) => {
    const parsed = parseScoreField(value);
    return parsed != null && parsed >= 0 && parsed <= SCALE;
  }, rangeMessage);

export type UpworkScoringFormValues = {
  skills: string;
  keywords: string;
  budget: string;
  location: string;
  clientRating: string;
  proposals: string;
  green: string;
  orange: string;
  yellow: string;
};

export function createUpworkScoringSchema(messages: {
  required: string;
  range: string;
  weightsSum: string;
  thresholdsOrder: string;
}) {
  return z
    .object({
      skills: weightOrThreshold(messages.required, messages.range),
      keywords: weightOrThreshold(messages.required, messages.range),
      budget: weightOrThreshold(messages.required, messages.range),
      location: weightOrThreshold(messages.required, messages.range),
      clientRating: weightOrThreshold(messages.required, messages.range),
      proposals: weightOrThreshold(messages.required, messages.range),
      green: weightOrThreshold(messages.required, messages.range),
      orange: weightOrThreshold(messages.required, messages.range),
      yellow: weightOrThreshold(messages.required, messages.range),
    })
    .superRefine((values, ctx) => {
      const weights = UPWORK_SCORING_WEIGHT_KEYS.map((key) => parseScoreField(values[key]) ?? 0);
      const sumApi = weights.reduce((total, value) => total + toApiScale(value), 0);
      if (sumApi !== 100) {
        ctx.addIssue({
          code: 'custom',
          message: messages.weightsSum,
          path: ['skills'],
        });
      }
      const green = parseScoreField(values.green) ?? 0;
      const orange = parseScoreField(values.orange) ?? 0;
      const yellow = parseScoreField(values.yellow) ?? 0;
      if (!(green > orange && orange > yellow)) {
        ctx.addIssue({
          code: 'custom',
          message: messages.thresholdsOrder,
          path: ['green'],
        });
      }
    });
}

export function scoringFormToPayload(values: UpworkScoringFormValues) {
  return {
    weights: {
      skills: toApiScale(parseScoreField(values.skills) ?? 0),
      keywords: toApiScale(parseScoreField(values.keywords) ?? 0),
      budget: toApiScale(parseScoreField(values.budget) ?? 0),
      location: toApiScale(parseScoreField(values.location) ?? 0),
      clientRating: toApiScale(parseScoreField(values.clientRating) ?? 0),
      proposals: toApiScale(parseScoreField(values.proposals) ?? 0),
    },
    thresholds: {
      green: toApiScale(parseScoreField(values.green) ?? 0),
      orange: toApiScale(parseScoreField(values.orange) ?? 0),
      yellow: toApiScale(parseScoreField(values.yellow) ?? 0),
    },
  };
}

export function scoringConfigToFormValues(config: {
  weights: {
    skills: number;
    keywords: number;
    budget: number;
    location: number;
    clientRating: number;
    proposals: number;
  };
  thresholds: { green: number; orange: number; yellow: number };
}): UpworkScoringFormValues {
  return {
    skills: fromApiScale(config.weights.skills),
    keywords: fromApiScale(config.weights.keywords),
    budget: fromApiScale(config.weights.budget),
    location: fromApiScale(config.weights.location),
    clientRating: fromApiScale(config.weights.clientRating),
    proposals: fromApiScale(config.weights.proposals),
    green: fromApiScale(config.thresholds.green),
    orange: fromApiScale(config.thresholds.orange),
    yellow: fromApiScale(config.thresholds.yellow),
  };
}

export function scoringFormWeightSum(values: UpworkScoringFormValues): number {
  const sumApi = UPWORK_SCORING_WEIGHT_KEYS.reduce(
    (total, key) => total + toApiScale(parseScoreField(values[key]) ?? 0),
    0,
  );
  return sumApi / SCALE;
}

export function scoringFormThresholdsApi(values: UpworkScoringFormValues): {
  green: number;
  orange: number;
  yellow: number;
} {
  return {
    green: toApiScale(parseScoreField(values.green) ?? 8),
    orange: toApiScale(parseScoreField(values.orange) ?? 6),
    yellow: toApiScale(parseScoreField(values.yellow) ?? 4),
  };
}
