import {
  PROPOSAL_EXAMPLE_BODY_MAX_LENGTH,
  PROPOSAL_EXAMPLE_RETRIEVAL_K,
  type ProposalGenerationExample,
} from '@constellation/shared';

type RankableExample = Readonly<{
  id: string;
  title: string | null;
  body: string;
  jobContext: string | null;
  isStarred: boolean;
}>;

function tokenize(text: string): Set<string> {
  const tokens = text
    .toLocaleLowerCase()
    .split(/[^a-z0-9+#.\u0600-\u06FF]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
  return new Set(tokens);
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let hits = 0;
  for (const token of a) {
    if (b.has(token)) hits += 1;
  }
  return hits;
}

export function rankProposalExamples(
  jobText: string,
  jobSkills: readonly string[],
  examples: readonly RankableExample[],
  limit = PROPOSAL_EXAMPLE_RETRIEVAL_K,
): ProposalGenerationExample[] {
  const jobTokens = tokenize(`${jobText}\n${jobSkills.join('\n')}`);

  const ranked = examples
    .map((example) => {
      const exampleTokens = tokenize(`${example.body}\n${example.jobContext ?? ''}\n${example.title ?? ''}`);
      const score = overlapScore(jobTokens, exampleTokens) + (example.isStarred ? 5 : 0);
      return { example, score };
    })
    .sort((a, b) => b.score - a.score || a.example.body.length - b.example.body.length);

  return ranked.slice(0, Math.max(0, limit)).map(({ example }) => ({
    title: example.title,
    body: example.body.slice(0, PROPOSAL_EXAMPLE_BODY_MAX_LENGTH),
    jobContext: example.jobContext,
  }));
}

export function rankedExampleIds(
  jobText: string,
  jobSkills: readonly string[],
  examples: readonly RankableExample[],
  limit = PROPOSAL_EXAMPLE_RETRIEVAL_K,
): string[] {
  const jobTokens = tokenize(`${jobText}\n${jobSkills.join('\n')}`);
  return examples
    .map((example) => {
      const exampleTokens = tokenize(`${example.body}\n${example.jobContext ?? ''}\n${example.title ?? ''}`);
      const score = overlapScore(jobTokens, exampleTokens) + (example.isStarred ? 5 : 0);
      return { id: example.id, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, limit))
    .map((row) => row.id);
}
