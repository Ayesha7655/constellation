import type { ProfileImportMatchReason } from '@constellation/shared';

export type FreelancerProfileView = {
  id: string;
  orgId: string;
  label: string | null;
  title: string | null;
  overview: string | null;
  skills: string[];
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  country: string | null;
  timezone: string | null;
  languages: string[];
  exclusions: string[];
  profileUrl: string | null;
  source: string;
  updatedAt: string;
  createdAt: string;
};

export type PendingDraftView = {
  id: string;
  payload: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
};

export type FreelancerProfilesListResult = {
  profiles: FreelancerProfileView[];
  pendingDraft: PendingDraftView | null;
};

export type FreelancerProfileResult = {
  profile: FreelancerProfileView;
};

export type ImportDraftResult = {
  draft: PendingDraftView;
  targetProfileId: string | null;
  matchReason: ProfileImportMatchReason | null;
};
