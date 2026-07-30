import {
  PORTFOLIO_RELEVANCE_MAX_LENGTH,
  PROPOSAL_PORTFOLIO_RETRIEVAL_K,
  type FindRelevantPortfolioRequest,
  type FindRelevantPortfolioResponse,
} from '@constellation/shared';

const STOP_WORDS = new Set([
  'and',
  'are',
  'build',
  'developer',
  'development',
  'experience',
  'for',
  'from',
  'have',
  'into',
  'looking',
  'need',
  'our',
  'project',
  'solution',
  'that',
  'the',
  'their',
  'this',
  'with',
  'will',
  'work',
  'you',
  'your',
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLocaleLowerCase()
      .split(/[^a-z0-9+#.\u0600-\u06FF]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
  );
}

function sharedValues(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((value) => right.has(value));
}

export function buildFallbackPortfolioRelevance(input: FindRelevantPortfolioRequest): FindRelevantPortfolioResponse {
  const jobTokens = tokenize(`${input.job.title}\n${input.job.description}\n${input.job.skills.join('\n')}`);
  const jobSkills = new Set(input.job.skills.map((skill) => skill.trim().toLocaleLowerCase()).filter(Boolean));

  const ranked = input.portfolio
    .map((project) => {
      const technologies = project.technologies.map((value) => value.trim()).filter(Boolean);
      const technologyMatches = technologies.filter((value) => jobSkills.has(value.toLocaleLowerCase()));
      const projectTokens = tokenize(
        `${project.title}\n${project.role ?? ''}\n${project.description ?? ''}\n${technologies.join('\n')}`,
      );
      const keywordMatches = sharedValues(jobTokens, projectTokens);
      return {
        project,
        technologyMatches,
        keywordMatches,
        score: technologyMatches.length * 5 + keywordMatches.length,
      };
    })
    .filter((row) => row.technologyMatches.length > 0 || row.keywordMatches.length >= 2)
    .sort((left, right) => right.score - left.score || left.project.title.localeCompare(right.project.title))
    .slice(0, PROPOSAL_PORTFOLIO_RETRIEVAL_K);

  return {
    matches: ranked.map(({ project, technologyMatches, keywordMatches }) => {
      const relevance =
        technologyMatches.length > 0
          ? `Built with ${technologyMatches.slice(0, 3).join(', ')}, matching the job's requested stack.`
          : `Covers ${keywordMatches.slice(0, 3).join(', ')}, mapping to the job's requested workflow.`;
      return {
        portfolioProjectId: project.id,
        relevance: relevance.slice(0, PORTFOLIO_RELEVANCE_MAX_LENGTH),
      };
    }),
  };
}
