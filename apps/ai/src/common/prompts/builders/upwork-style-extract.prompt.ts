import { loadPrompt, renderPromptTemplate } from '../load-prompt';

export function getUpworkStyleExtractSystemPrompt(): string {
  return loadPrompt('upwork-style-extract/system.md');
}

export function buildUpworkStyleExtractUserPrompt(examples: Array<Record<string, unknown>>): string {
  return renderPromptTemplate(loadPrompt('upwork-style-extract/user.md'), {
    EXAMPLES_JSON: JSON.stringify(examples, null, 2),
  });
}
