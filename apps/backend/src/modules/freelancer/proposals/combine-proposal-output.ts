import { PROPOSAL_BODY_MAX_LENGTH, type RelevantPortfolioMatch } from '@constellation/shared';

type PortfolioCandidateForComposition = Readonly<{
  id: string;
  title: string;
  projectUrl: string | null;
  links: ReadonlyArray<{ label?: string; url: string }>;
}>;

export type ResolvedPortfolioMatch = Readonly<{
  portfolioProjectId: string;
  title: string;
  relevance: string;
  url: string;
}>;

export function resolvePortfolioMatches(
  matches: readonly RelevantPortfolioMatch[],
  candidates: readonly PortfolioCandidateForComposition[],
): ResolvedPortfolioMatch[] {
  const candidatesById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const seen = new Set<string>();
  const resolved: ResolvedPortfolioMatch[] = [];

  for (const match of matches) {
    if (seen.has(match.portfolioProjectId)) continue;
    const candidate = candidatesById.get(match.portfolioProjectId);
    const url = candidate?.projectUrl?.trim() || candidate?.links.find((link) => link.url.trim())?.url.trim() || '';
    if (!candidate || !url || !match.relevance.trim()) continue;

    seen.add(match.portfolioProjectId);
    resolved.push({
      portfolioProjectId: match.portfolioProjectId,
      title: candidate.title,
      relevance: match.relevance.trim(),
      url,
    });
  }

  return resolved;
}

export function combineProposalOutput(
  proposalBody: string,
  portfolioMatches: readonly ResolvedPortfolioMatch[],
): string {
  const proposal = proposalBody.trim();
  if (portfolioMatches.length === 0) return proposal.slice(0, PROPOSAL_BODY_MAX_LENGTH);

  const portfolioSection = [
    'Relevant portfolio:',
    ...portfolioMatches.flatMap((match) => ['', match.title, `How it maps: ${match.relevance}`, `Link: ${match.url}`]),
  ].join('\n');

  const availableProposalLength = Math.max(0, PROPOSAL_BODY_MAX_LENGTH - portfolioSection.length - 2);
  const boundedProposal = proposal.slice(0, availableProposalLength).trimEnd();
  return `${boundedProposal}\n\n${portfolioSection}`.trim().slice(0, PROPOSAL_BODY_MAX_LENGTH);
}
