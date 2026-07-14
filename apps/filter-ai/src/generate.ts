import OpenAI from 'openai';
import { z } from 'zod';

/** Target actor: https://apify.com/blackfalcondata/upwork-scraper */
const SYSTEM_PROMPT = `You generate Apify actor input JSON for blackfalcondata/upwork-scraper
(Upwork job search). Return ONLY valid JSON — no markdown.

Allowed fields (use only these unless clearly useful and documented by the actor):
- query: string or string[] — primary search keywords derived from title + skills
- jobType: "hourly" | "fixed" | "any"
- experienceLevel: e.g. "EntryLevel" | "Intermediate" | "Expert" (or array)
- sort: prefer "recency"
- category: string or string[] of Upwork categories when obvious (e.g. "Web Development")
- location: optional client-location filters (country names or ISO codes)
- excludeLocations: optional
- budget: fixed-price range string if profile implies fixed work (e.g. "100-1000")
- hourlyRate: "min-max" or "min-" from profile hourly rates (USD/hr)
- verifiedPaymentOnly: boolean (default true when uncertain)
- proposals: optional competition filter (e.g. "0-5", "5-10", "10-15", "15-20", "20-50")
- maxResults: integer 20–100 (default 50)
- workload: optional ("as_needed" | "part_time" | "full_time")

Rules:
1. Prefer recent jobs (sort=recency).
2. Build query from the strongest skills + title tokens; keep it concise.
3. Map hourlyRateMin/Max → hourlyRate like "40-80" or "50-".
4. Honor exclusions by avoiding those terms in query (do not invent exclude fields that do not exist).
5. Do not invent fake categories; omit category if unsure.
6. Never include secrets or commentary.`;

const filtersSchema = z
  .object({
    query: z.union([z.string(), z.array(z.string())]).optional(),
    jobType: z.string().optional(),
    experienceLevel: z.union([z.string(), z.array(z.string())]).optional(),
    sort: z.string().optional(),
    category: z.union([z.string(), z.array(z.string())]).optional(),
    location: z.array(z.unknown()).optional(),
    excludeLocations: z.array(z.unknown()).optional(),
    budget: z.string().optional(),
    hourlyRate: z.string().optional(),
    verifiedPaymentOnly: z.boolean().optional(),
    proposals: z.string().optional(),
    maxResults: z.number().int().min(1).max(200).optional(),
    workload: z.string().optional(),
  })
  .passthrough();

function fallbackFilters(profile: Record<string, unknown>): Record<string, unknown> {
  const skills = Array.isArray(profile.skills)
    ? profile.skills.filter((s): s is string => typeof s === 'string')
    : [];
  const title = typeof profile.title === 'string' ? profile.title : '';
  const queryParts = [...skills.slice(0, 5), ...title.split(/\s+/).slice(0, 4)].filter(Boolean);
  const min = typeof profile.hourlyRateMin === 'number' ? profile.hourlyRateMin : null;
  const max = typeof profile.hourlyRateMax === 'number' ? profile.hourlyRateMax : null;

  let hourlyRate: string | undefined;
  if (min != null && max != null) {
    hourlyRate = `${min}-${max}`;
  } else if (min != null) {
    hourlyRate = `${min}-`;
  }

  return {
    query: queryParts.join(' ') || 'software developer',
    sort: 'recency',
    jobType: 'any',
    verifiedPaymentOnly: true,
    maxResults: 50,
    ...(hourlyRate ? { hourlyRate } : {}),
  };
}

export async function generateUpworkFilters(profile: Record<string, unknown>): Promise<Record<string, unknown>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey.includes('example')) {
    console.warn('[filter-ai] OPENAI_API_KEY missing/example — using heuristic fallback');
    return fallbackFilters(profile);
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Freelancer profile JSON:\n${JSON.stringify(profile, null, 2)}\n\nReturn Apify input filters JSON.`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return fallbackFilters(profile);
  }

  try {
    const parsed = JSON.parse(content) as unknown;
    const result = filtersSchema.safeParse(parsed);
    if (!result.success) {
      console.warn('[filter-ai] schema validation failed — fallback');
      return fallbackFilters(profile);
    }
    return {
      sort: 'recency',
      maxResults: 50,
      verifiedPaymentOnly: true,
      ...result.data,
    };
  } catch {
    return fallbackFilters(profile);
  }
}
