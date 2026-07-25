export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
  DEACTIVATED = 'DEACTIVATED',
}

export enum AuthProvider {
  PASSWORD = 'PASSWORD',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

export enum SessionPlatform {
  WEB = 'WEB',
  ANDROID = 'ANDROID',
  IOS = 'IOS',
}

export enum FreelancerProfileSource {
  MANUAL = 'manual',
  EXTENSION = 'extension',
}

export enum SearchFilterProvenance {
  AI = 'ai',
  MANUAL = 'manual',
}

export enum ScrapeRunStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

export enum ScrapeRunTrigger {
  MANUAL = 'manual',
  SCHEDULE = 'schedule',
}

export enum ProposalExampleSource {
  UPLOAD = 'upload',
  ACCEPTED_DRAFT = 'accepted_draft',
}

export enum ProposalDraftStatus {
  DRAFT = 'draft',
  SAVED = 'saved',
}

export enum ProposalDraftProvenance {
  AI = 'ai',
  MANUAL = 'manual',
}

export enum ProposalDraftSource {
  WEB = 'web',
  EXTENSION_JOB_PAGE = 'extension_job_page',
}
