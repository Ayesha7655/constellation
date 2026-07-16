import { z } from 'zod';

const proxyConfigurationSchema = z
  .object({
    useApifyProxy: z.boolean().optional(),
    apifyProxyGroups: z.array(z.string().min(1)).min(1).optional(),
    apifyProxyCountry: z.string().min(1).optional(),
    country: z.string().min(1).optional(),
  })
  .strict();

export const upworkFilterSchema = z
  .object({
    queries: z.array(z.string().min(1).max(120)).min(1).max(40),
    item_limit: z.number().int().min(1).max(100).optional(),
    job_posted: z.number().int().min(1).max(168).optional(),
    proxyConfiguration: proxyConfigurationSchema.optional(),
  })
  .strict();
