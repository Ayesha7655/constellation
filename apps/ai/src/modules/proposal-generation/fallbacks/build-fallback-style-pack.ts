import type { ExtractStylePackRequest, ProposalStylePreferences } from '@constellation/shared';

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Deterministic style sketch when OpenAI is unavailable or returns invalid output. */
export function buildFallbackStylePack(input: ExtractStylePackRequest): ProposalStylePreferences {
  const bodies = input.examples.map((example) => example.body.trim()).filter(Boolean);
  const counts = bodies.map(wordCount);
  const avg = counts.length > 0 ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length) : 150;

  let lengthTarget = 'medium (~150 words)';
  if (avg < 100) lengthTarget = 'short (~80–120 words)';
  else if (avg > 220) lengthTarget = 'long (~220–300 words)';
  else lengthTarget = `about ${avg} words`;

  const opensWarm = bodies.some((body) => /^(hi|hello|hey)\b/i.test(body.trim()));
  const mentionsRate = bodies.some((body) => /\$|\/hr|hour|rate|budget/i.test(body));
  const hasQuestions = bodies.some((body) => body.includes('?'));

  return {
    tone: opensWarm ? 'Friendly and professional' : 'Direct and professional',
    lengthTarget,
    structureNotes: hasQuestions
      ? 'Open with relevance, show fit with brief proof, ask clarifying questions, close with a clear CTA.'
      : 'Open with relevance, show fit with brief proof, outline next steps, close with a clear CTA.',
    alwaysUse: [],
    neverUse: [],
    rateMentionPolicy: mentionsRate
      ? 'Mention rate or budget fit when the examples do; keep it brief.'
      : 'Do not lead with rate; focus on fit first unless the job asks.',
    ctaStyle: 'Invite a short reply or call to discuss fit.',
    extraNotes: 'Derived heuristically from uploaded examples; edit to refine.',
  };
}
