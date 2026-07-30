import { z } from 'zod';
import { PORTFOLIO_RELEVANCE_MAX_LENGTH, PROPOSAL_PORTFOLIO_RETRIEVAL_K } from '@constellation/shared';

export const portfolioRelevanceSchema = z
  .object({
    matches: z
      .array(
        z
          .object({
            portfolioProjectId: z.string().uuid(),
            relevance: z.string().trim().min(1).max(PORTFOLIO_RELEVANCE_MAX_LENGTH),
          })
          .strict(),
      )
      .max(PROPOSAL_PORTFOLIO_RETRIEVAL_K),
  })
  .strict();
