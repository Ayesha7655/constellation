import {
  DEFAULT_UPWORK_APIFY_FILTERS,
  type UpworkApifySearchFilters,
  type UpworkFilterGenerationProfile,
} from '@constellation/shared';

function uniqueTerms(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.toLocaleLowerCase().trim();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function profileBlob(profile: UpworkFilterGenerationProfile): string {
  return [profile.title, profile.overview, ...profile.skills].filter(Boolean).join(' ').toLocaleLowerCase();
}

function includesAny(blob: string, needles: readonly string[]): boolean {
  return needles.some((needle) => blob.includes(needle.toLocaleLowerCase()));
}

/**
 * Deterministic high-recall query set when OpenAI is unavailable or returns invalid JSON.
 * Mirrors the breadth expected from the AI prompt (domains + stack), not a thin skill list.
 */
export function buildFallbackFilters(profile: UpworkFilterGenerationProfile): UpworkApifySearchFilters {
  const excluded = new Set(profile.exclusions.map((term) => term.toLocaleLowerCase()));
  const blob = profileBlob(profile);
  const skills = uniqueTerms(profile.skills).filter((term) => !excluded.has(term.toLocaleLowerCase()));

  const domainQueries: string[] = [];

  if (includesAny(blob, ['ai', 'llm', 'gpt', 'openai', 'langchain', 'chatbot', 'generative', 'machine learning', 'nlp'])) {
    domainQueries.push(
      'AI chatbot development',
      'LLM integration',
      'GPT integration',
      'OpenAI API developer',
      'LangChain developer',
      'RAG pipeline',
      'AI web application',
      'AI agent development',
      'Prompt engineering',
      'Vector database developer',
      'NLP engineer',
      'machine learning engineer',
    );
  }

  if (includesAny(blob, ['mvp', 'startup', 'prototype', 'saas', 'full stack', 'fullstack'])) {
    domainQueries.push(
      'MVP development',
      'startup MVP developer',
      'rapid prototyping',
      'SaaS development',
      'multi-tenant SaaS',
      'SaaS architecture',
      'full stack developer',
    );
  }

  if (includesAny(blob, ['automat', 'workflow', 'n8n', 'zapier', 'make.com'])) {
    domainQueries.push(
      'workflow automation',
      'n8n automation',
      'Zapier automation',
      'Make automation',
      'business process automation',
    );
  }

  if (includesAny(blob, ['api', 'graphql', 'rest', 'microservice', 'nestjs', 'fastapi'])) {
    domainQueries.push('REST API development', 'GraphQL API development', 'microservices developer');
  }

  if (includesAny(blob, ['pipeline', 'etl', 'mlops', 'data', 'tensorflow', 'pytorch'])) {
    domainQueries.push('data pipeline engineer', 'ETL pipeline', 'MLOps engineer', 'predictive modeling');
  }

  if (includesAny(blob, ['aws', 'docker', 'kubernetes', 'devops', 'ci/cd', 'cloud'])) {
    domainQueries.push(
      'AWS deployment',
      'Docker Kubernetes DevOps',
      'CI/CD pipeline',
      'cloud infrastructure engineer',
      'zero downtime deployment',
    );
  }

  if (includesAny(blob, ['stripe', 'billing', 'payment'])) {
    domainQueries.push('Stripe integration developer');
  }

  const skillQueries = skills.flatMap((skill) => {
    const lower = skill.toLocaleLowerCase();
    if (lower.includes(' ')) {
      return [`${skill} developer`, skill];
    }
    return [`${skill} developer`];
  });

  const paired: string[] = [];
  const has = (needle: string) => skills.some((s) => s.toLocaleLowerCase().includes(needle));
  if (has('react') && has('next')) paired.push('React Next.js developer');
  if (has('node') && (has('nest') || blob.includes('nestjs'))) paired.push('Node.js NestJS developer');
  if (has('python') && has('fastapi')) paired.push('Python FastAPI');
  if (has('docker') && has('kubernetes')) paired.push('Docker Kubernetes DevOps');
  if (has('typescript')) paired.push('TypeScript developer');

  const queries = uniqueTerms([...domainQueries, ...paired, ...skillQueries])
    .filter((query) => {
      const lower = query.toLocaleLowerCase();
      for (const term of excluded) {
        if (term && lower.includes(term)) return false;
      }
      return true;
    })
    .slice(0, 50);

  return {
    queries: queries.length > 0 ? queries : ['software developer'],
    item_limit: DEFAULT_UPWORK_APIFY_FILTERS.item_limit,
    job_posted: DEFAULT_UPWORK_APIFY_FILTERS.job_posted,
    proxyConfiguration: DEFAULT_UPWORK_APIFY_FILTERS.proxyConfiguration,
  };
}
