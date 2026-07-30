import { loadPrompt, renderPromptTemplate } from '../load-prompt';

export function getUpworkPortfolioRelevanceSystemPrompt(): string {
  return loadPrompt('upwork-portfolio-relevance/system.md');
}

export function buildUpworkPortfolioRelevanceUserPrompt(input: {
  job: Record<string, unknown>;
  portfolio: Array<Record<string, unknown>>;
}): string {
  return renderPromptTemplate(loadPrompt('upwork-portfolio-relevance/user.md'), {
    JOB_JSON: JSON.stringify(input.job, null, 2),
    PORTFOLIO_JSON: JSON.stringify(input.portfolio, null, 2),
  });
}
