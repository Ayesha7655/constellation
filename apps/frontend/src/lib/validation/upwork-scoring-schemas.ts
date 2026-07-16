import { z } from 'zod';
import { UPWORK_SCORING_WEIGHT_KEYS } from '@constellation/shared';
import { requiredText } from '@/lib/validation/form-fields';

function parseIntField(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  return Number.parseInt(value.trim(), 10);
}

const weightOrThreshold = (requiredMessage: string, rangeMessage: string) =>
  requiredText(requiredMessage).refine((value) => {
    const parsed = parseIntField(value);
    return parsed != null && parsed >= 0 && parsed <= 100;
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
      const weights = UPWORK_SCORING_WEIGHT_KEYS.map((key) => parseIntField(values[key]) ?? 0);
      const sum = weights.reduce((total, value) => total + value, 0);
      if (sum !== 100) {
        ctx.addIssue({
          code: 'custom',
          message: messages.weightsSum,
          path: ['skills'],
        });
      }
      const green = parseIntField(values.green) ?? 0;
      const orange = parseIntField(values.orange) ?? 0;
      const yellow = parseIntField(values.yellow) ?? 0;
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
      skills: parseIntField(values.skills) ?? 0,
      keywords: parseIntField(values.keywords) ?? 0,
      budget: parseIntField(values.budget) ?? 0,
      location: parseIntField(values.location) ?? 0,
      clientRating: parseIntField(values.clientRating) ?? 0,
      proposals: parseIntField(values.proposals) ?? 0,
    },
    thresholds: {
      green: parseIntField(values.green) ?? 0,
      orange: parseIntField(values.orange) ?? 0,
      yellow: parseIntField(values.yellow) ?? 0,
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
    skills: String(config.weights.skills),
    keywords: String(config.weights.keywords),
    budget: String(config.weights.budget),
    location: String(config.weights.location),
    clientRating: String(config.weights.clientRating),
    proposals: String(config.weights.proposals),
    green: String(config.thresholds.green),
    orange: String(config.thresholds.orange),
    yellow: String(config.thresholds.yellow),
  };
}
