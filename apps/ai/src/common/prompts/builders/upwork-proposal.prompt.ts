import { loadPrompt, renderPromptTemplate } from '../load-prompt';

export function getUpworkProposalSystemPrompt(): string {
  return loadPrompt('upwork-proposal/system.md');
}

export function buildUpworkProposalUserPrompt(input: {
  stylePack: Record<string, unknown>;
  profile: Record<string, unknown>;
  job: Record<string, unknown>;
  examples: Array<Record<string, unknown>>;
  portfolio?: Array<Record<string, unknown>>;
}): string {
  return renderPromptTemplate(loadPrompt('upwork-proposal/user.md'), {
    STYLE_PACK_JSON: JSON.stringify(input.stylePack, null, 2),
    PROFILE_JSON: JSON.stringify(input.profile, null, 2),
    JOB_JSON: JSON.stringify(input.job, null, 2),
    EXAMPLES_JSON: JSON.stringify(input.examples, null, 2),
    PORTFOLIO_JSON: JSON.stringify(input.portfolio ?? [], null, 2),
  });
}
