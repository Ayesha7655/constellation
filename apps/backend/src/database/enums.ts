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
