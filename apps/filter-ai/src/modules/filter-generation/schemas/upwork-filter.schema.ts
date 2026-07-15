import { z } from 'zod';

const locationSchema = z.union([
  z.string().min(1),
  z.object({
    type: z.enum(['COUNTRY', 'REGION']),
    value: z.string().min(1),
  }),
]);

export const upworkFilterSchema = z
  .object({
    query: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]).optional(),
    jobType: z.enum(['hourly', 'fixed', 'any']).optional(),
    experienceLevel: z
      .union([
        z.enum(['EntryLevel', 'Intermediate', 'Expert']),
        z.array(z.enum(['EntryLevel', 'Intermediate', 'Expert'])).min(1),
      ])
      .optional(),
    sort: z.enum(['recency', 'relevance']).optional(),
    category: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]).optional(),
    location: z.array(locationSchema).min(1).optional(),
    excludeLocations: z.array(locationSchema).min(1).optional(),
    budget: z.string().min(1).optional(),
    hourlyRate: z
      .string()
      .regex(/^\d+-(\d+)?$/)
      .optional(),
    verifiedPaymentOnly: z.boolean().optional(),
    proposals: z.enum(['0-5', '5-10', '10-15', '15-20', '20-50']).optional(),
    maxResults: z.number().int().min(20).max(100).optional(),
    workload: z.enum(['as_needed', 'part_time', 'full_time']).optional(),
  })
  .strict();
