import type { FreelancerProfileDto } from '@/services/freelancer-api';

export type ProfileFormValues = {
  label: string;
  title: string;
  overview: string;
  skills: string;
  hourlyRateMin: string;
  hourlyRateMax: string;
  country: string;
  timezone: string;
  languages: string;
  exclusions: string;
  profileUrl: string;
};

export function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function joinCsv(values: string[] | undefined): string {
  return (values ?? []).join(', ');
}

export function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function asStringList(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value.filter((item): item is string => typeof item === 'string').join(', ');
}

export function asRate(value: unknown): string {
  return typeof value === 'number' ? String(value) : '';
}

export function profileToValues(profile: FreelancerProfileDto | null): ProfileFormValues {
  return {
    label: profile?.label ?? '',
    title: profile?.title ?? '',
    overview: profile?.overview ?? '',
    skills: joinCsv(profile?.skills),
    hourlyRateMin: profile?.hourlyRateMin != null ? String(profile.hourlyRateMin) : '',
    hourlyRateMax: profile?.hourlyRateMax != null ? String(profile.hourlyRateMax) : '',
    country: profile?.country ?? '',
    timezone: profile?.timezone ?? '',
    languages: joinCsv(profile?.languages),
    exclusions: joinCsv(profile?.exclusions),
    profileUrl: profile?.profileUrl ?? '',
  };
}

export function profileDisplayName(profile: Pick<FreelancerProfileDto, 'label' | 'title'>, fallback: string): string {
  return profile.label?.trim() || profile.title?.trim() || fallback;
}
