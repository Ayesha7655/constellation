import { z } from 'zod';

export type ProposalStylePackFormValues = {
  tone: string;
  lengthTarget: string;
  structureNotes: string;
  alwaysUse: string;
  neverUse: string;
  rateMentionPolicy: string;
  ctaStyle: string;
  extraNotes: string;
};

export type ProposalExampleFormValues = {
  title: string;
  body: string;
  jobContext: string;
};

export function createProposalStylePackSchema(_messages: { required: string }) {
  return z.object({
    tone: z.preprocess((v) => (v == null ? '' : v), z.string().max(400)),
    lengthTarget: z.preprocess((v) => (v == null ? '' : v), z.string().max(160)),
    structureNotes: z.preprocess((v) => (v == null ? '' : v), z.string().max(2000)),
    alwaysUse: z.preprocess((v) => (v == null ? '' : v), z.string().max(3000)),
    neverUse: z.preprocess((v) => (v == null ? '' : v), z.string().max(3000)),
    rateMentionPolicy: z.preprocess((v) => (v == null ? '' : v), z.string().max(800)),
    ctaStyle: z.preprocess((v) => (v == null ? '' : v), z.string().max(800)),
    extraNotes: z.preprocess((v) => (v == null ? '' : v), z.string().max(2000)),
  });
}

export function createProposalExampleSchema(messages: { bodyRequired: string }) {
  return z.object({
    title: z.preprocess((v) => (v == null ? '' : v), z.string().max(200)),
    body: z.preprocess(
      (v) => (typeof v === 'string' ? v : ''),
      z.string().trim().min(1, messages.bodyRequired).max(8000),
    ),
    jobContext: z.preprocess((v) => (v == null ? '' : v), z.string().max(2000)),
  });
}

export function splitCommaList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
