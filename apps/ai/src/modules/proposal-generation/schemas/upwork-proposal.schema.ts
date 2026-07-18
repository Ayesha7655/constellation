import { z } from 'zod';
import { PROPOSAL_BODY_MAX_LENGTH } from '@constellation/shared';

export const upworkProposalSchema = z
  .object({
    body: z.string().trim().min(1).max(PROPOSAL_BODY_MAX_LENGTH),
  })
  .strict();
