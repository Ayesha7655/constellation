/** Style preferences stored on proposal_style_packs.preferences JSONB. */
export type ProposalStylePreferences = {
  tone?: string | null;
  lengthTarget?: string | null;
  structureNotes?: string | null;
  alwaysUse?: string[];
  neverUse?: string[];
  rateMentionPolicy?: string | null;
  ctaStyle?: string | null;
  extraNotes?: string | null;
};

/** Where a proposal draft was created. */
export const PROPOSAL_DRAFT_SOURCES = ['web', 'extension_job_page'] as const;
export type ProposalDraftSource = (typeof PROPOSAL_DRAFT_SOURCES)[number];
export const PROPOSAL_DRAFT_SOURCE_WEB: ProposalDraftSource = 'web';
export const PROPOSAL_DRAFT_SOURCE_EXTENSION_JOB_PAGE: ProposalDraftSource = 'extension_job_page';

export type ProposalGenerationProfile = {
  title: string | null;
  overview: string | null;
  skills: string[];
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  country: string | null;
  languages: string[];
};

export type ProposalGenerationJob = {
  title: string;
  description: string;
  skills: string[];
  budget: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  clientLocation: string | null;
};

export type ProposalGenerationExample = {
  title: string | null;
  body: string;
  jobContext: string | null;
};

/** Ranked portfolio project cited when generating a proposal. */
export type ProposalGenerationPortfolioProject = {
  title: string;
  role: string | null;
  description: string | null;
  technologies: string[];
  /** Upwork portfolio page URL (`?p=`). */
  projectUrl: string | null;
  /** Non-Upwork demo / case-study links from the project. */
  links: ReadonlyArray<{ label?: string; url: string }>;
};

/** Metadata for a document attached to a proposal draft or example. */
export type ProposalAttachmentMeta = {
  id: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
};

export type GenerateProposalRequest = {
  stylePack: ProposalStylePreferences;
  profile: ProposalGenerationProfile;
  job: ProposalGenerationJob;
  examples: ProposalGenerationExample[];
  /** Job-relevant portfolio projects (may be empty). */
  portfolio?: ProposalGenerationPortfolioProject[];
};

export type GenerateProposalResponse = {
  body: string;
};

export type ExtractStylePackRequest = {
  examples: ProposalGenerationExample[];
};

export type ExtractStylePackResponse = {
  preferences: ProposalStylePreferences;
};

export const PROPOSAL_BODY_MAX_LENGTH = 8000;
export const PROPOSAL_EXAMPLE_BODY_MAX_LENGTH = 8000;
export const PROPOSAL_EXAMPLE_RETRIEVAL_K = 5;
/** Max portfolio projects injected into proposal generation. */
export const PROPOSAL_PORTFOLIO_RETRIEVAL_K = 3;
/** Minimum uploaded examples before style-pack extraction is allowed. */
export const PROPOSAL_STYLE_EXTRACT_MIN_EXAMPLES = 2;

/** Max documents per draft or example (Upwork-style proposal attachments). */
export const PROPOSAL_ATTACHMENT_MAX_COUNT = 10;

/** Max bytes per attachment (25 MiB). */
export const PROPOSAL_ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;

/** Common document MIME types accepted for proposal attachments. */
export const PROPOSAL_ATTACHMENT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/rtf',
  'text/plain',
  'text/rtf',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;
