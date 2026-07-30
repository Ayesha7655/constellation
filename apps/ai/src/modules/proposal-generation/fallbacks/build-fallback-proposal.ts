import type { GenerateProposalRequest } from '@constellation/shared';

export function buildFallbackProposal(input: GenerateProposalRequest): string {
  const title = input.profile.title?.trim() || 'freelancer';
  const skills = input.profile.skills.slice(0, 6).join(', ');
  const jobTitle = input.job.title.trim() || 'this role';
  const skillsLine = skills ? ` My focus includes ${skills}.` : '';
  return [
    `Hi — I'm interested in ${jobTitle}.`,
    '',
    `I'm a ${title}.${skillsLine}`,
    '',
    'I can jump in quickly, clarify requirements, and deliver clear progress updates.',
    '',
    'Happy to discuss fit and next steps.',
  ].join('\n');
}
