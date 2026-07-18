import { z } from 'zod';

export const upworkStylePackSchema = z
  .object({
    tone: z.string().trim().max(400).optional().nullable(),
    lengthTarget: z.string().trim().max(160).optional().nullable(),
    structureNotes: z.string().trim().max(2000).optional().nullable(),
    alwaysUse: z.array(z.string().trim().max(120)).max(20).optional(),
    neverUse: z.array(z.string().trim().max(120)).max(20).optional(),
    rateMentionPolicy: z.string().trim().max(800).optional().nullable(),
    ctaStyle: z.string().trim().max(800).optional().nullable(),
    extraNotes: z.string().trim().max(2000).optional().nullable(),
  })
  .strict();
