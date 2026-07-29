import {
  PROPOSAL_PORTFOLIO_RETRIEVAL_K,
  type ProposalGenerationPortfolioProject,
} from '@constellation/shared';

type RankablePortfolioProject = Readonly<{
  id: string;
  title: string;
  role: string | null;
  description: string | null;
  technologies: readonly string[];
  projectUrl: string | null;
  links: ReadonlyArray<{ label?: string; url: string }>;
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

export function rankPortfolioProjects(
  jobText: string,
  jobSkills: readonly string[],
  projects: readonly RankablePortfolioProject[],
  limit = PROPOSAL_PORTFOLIO_RETRIEVAL_K,
): Readonly<{
  portfolio: ProposalGenerationPortfolioProject[];
  portfolioIds: string[];
}> {
  const jobTokens = tokenize(`${jobText}\n${jobSkills.join('\n')}`);

  const ranked = projects
    .map((project) => {
      const projectTokens = tokenize(
        [
          project.title,
          project.role ?? '',
          project.description ?? '',
          project.technologies.join('\n'),
        ].join('\n'),
      );
      const score = overlapScore(jobTokens, projectTokens);
      return { project, score };
    })
    .sort((a, b) => b.score - a.score || a.project.title.localeCompare(b.project.title));

  const selected =
    ranked.some((row) => row.score > 0)
      ? ranked.filter((row) => row.score > 0).slice(0, Math.max(0, limit))
      : ranked.slice(0, Math.max(0, Math.min(limit, 1)));

  return {
    portfolioIds: selected.map(({ project }) => project.id),
    portfolio: selected.map(({ project }) => ({
      title: project.title,
      role: project.role,
      description: project.description ? project.description.slice(0, 1200) : null,
      technologies: [...project.technologies].slice(0, 20),
      projectUrl: project.projectUrl,
      links: project.links.slice(0, 5).map((link) =>
        link.label ? { label: link.label, url: link.url } : { url: link.url },
      ),
    })),
  };
}

/** Append missing portfolio URLs so proposals always cite selected work when available. */
export function ensurePortfolioLinksInBody(
  body: string,
  portfolio: readonly ProposalGenerationPortfolioProject[],
): string {
  const trimmed = body.trim();
  if (!portfolio.length) return trimmed;

  const missing = portfolio.filter((project) => {
    const urls = [
      project.projectUrl,
      ...project.links.map((link) => link.url),
    ].filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
    if (urls.length === 0) return false;
    return urls.every((url) => !trimmed.includes(url));
  });

  if (missing.length === 0) return trimmed;

  const lines = missing.map((project) => {
    const primary =
      project.projectUrl?.trim() ||
      project.links.find((link) => link.url.trim())?.url.trim() ||
      '';
    return primary ? `- ${project.title}: ${primary}` : `- ${project.title}`;
  });

  return `${trimmed}\n\nRelevant work:\n${lines.join('\n')}`;
}
