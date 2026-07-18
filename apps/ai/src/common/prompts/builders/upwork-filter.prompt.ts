import type { UpworkFilterGenerationProfile } from '@constellation/shared';
import { loadPrompt, renderPromptTemplate } from '../load-prompt';

export function getUpworkFilterSystemPrompt(): string {
  return loadPrompt('upwork-filter/system.md');
}

export function buildUpworkFilterUserPrompt(profile: UpworkFilterGenerationProfile): string {
  return renderPromptTemplate(loadPrompt('upwork-filter/user.md'), {
    PROFILE_JSON: JSON.stringify(profile, null, 2),
  });
}
