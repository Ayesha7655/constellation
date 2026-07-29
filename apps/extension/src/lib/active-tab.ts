import type { ScrapedProfile } from '../types';

type ScrapeResponse = Readonly<{ ok: true; profile: ScrapedProfile }> | Readonly<{ ok: false; error?: string }>;

type ScrapePortfolioResponse =
  | Readonly<{ ok: true; project: ScrapedPortfolioProject }>
  | Readonly<{ ok: false; error?: string }>;

export type ScrapedPortfolioProject = Readonly<{
  externalId: string;
  profileUrl: string;
  projectUrl: string;
  title: string;
  role: string | null;
  description: string | null;
  technologies: string[];
  links: ReadonlyArray<{ label?: string; url: string }>;
  imageUrls: string[];
  publishedOn: string | null;
  rawSnapshot?: Record<string, unknown>;
}>;

const INVALID_PROFILE_PAGE = 'Not a valid Upwork profile page.';

export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

/** Upwork host + `/freelancers/{slug}` — rejects the bare listing path. */
export function isUpworkProfileTab(tab: chrome.tabs.Tab | null): boolean {
  if (!tab?.id || !tab.url) return false;
  return normalizeUpworkFreelancerProfileUrl(tab.url) !== null;
}

/** Freelancer URL with portfolio project query `?p=`. */
export function isUpworkPortfolioProjectTab(tab: chrome.tabs.Tab | null): boolean {
  if (!tab?.id || !tab.url) return false;
  return isUpworkPortfolioProjectUrl(tab.url);
}

/** Upwork host + `/jobs/…` or apply flow `/nx/proposals/job/~0…/apply/`. */
export function isUpworkJobTab(tab: chrome.tabs.Tab | null): boolean {
  if (!tab?.id || !tab.url) return false;
  return isUpworkJobUrl(tab.url);
}

export function parseUpworkJobExternalId(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  return raw.match(/~0*(\d+)/)?.[1] ?? raw.match(/\/jobs\/[^/_]+_~0*(\d+)/)?.[1] ?? null;
}

/** Job listing (`/jobs/…`) or apply flow (`/nx/proposals/job/~0…/apply/`). */
export function isUpworkJobPath(pathname: string): boolean {
  if (pathname.includes('/jobs/')) return true;
  if (/\/proposals\/job\/~0*\d+/i.test(pathname)) return true;
  return false;
}

export function isUpworkJobUrl(raw: string | null | undefined): boolean {
  if (typeof raw !== 'string' || !raw.trim()) return false;
  try {
    const url = new URL(raw.trim());
    const isUpworkHost = url.hostname === 'upwork.com' || url.hostname.endsWith('.upwork.com');
    if (!isUpworkHost) return false;
    if (!isUpworkJobPath(url.pathname)) return false;
    return parseUpworkJobExternalId(url.toString()) !== null;
  } catch {
    return false;
  }
}

export function normalizeUpworkFreelancerProfileUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const url = new URL(raw.trim());
    const isUpworkHost = url.hostname === 'upwork.com' || url.hostname.endsWith('.upwork.com');
    if (!isUpworkHost) return null;
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const match = /^\/freelancers\/([^/]+)$/.exec(path);
    const slug = match?.[1];
    if (!slug) return null;
    return `https://www.upwork.com/freelancers/${slug}`;
  } catch {
    return null;
  }
}

export function parseUpworkPortfolioProjectId(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const url = new URL(raw.trim());
    const value = url.searchParams.get('p')?.trim();
    if (!value || !/^\d+$/.test(value)) return null;
    return value;
  } catch {
    return null;
  }
}

export function isUpworkPortfolioProjectUrl(raw: string | null | undefined): boolean {
  return (
    normalizeUpworkFreelancerProfileUrl(raw) !== null && parseUpworkPortfolioProjectId(raw) !== null
  );
}

/** Client-side guard before calling import — backend remains source of truth. */
export function assertValidScrapedProfile(profile: ScrapedProfile): void {
  const profileUrl = normalizeUpworkFreelancerProfileUrl(profile.profileUrl);
  if (!profileUrl) {
    throw new Error(INVALID_PROFILE_PAGE);
  }
  const title = typeof profile.title === 'string' ? profile.title.trim() : '';
  const overview = typeof profile.overview === 'string' ? profile.overview.trim() : '';
  const skills = profile.skills.filter((s) => typeof s === 'string' && s.trim().length > 0);
  if (!title && !overview && skills.length === 0) {
    throw new Error(INVALID_PROFILE_PAGE);
  }
}

export async function scrapeActiveProfile(tab: chrome.tabs.Tab): Promise<ScrapedProfile> {
  const tabId = tab.id;
  if (!tabId) throw new Error('Open an Upwork profile page first.');

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type: 'SCRAPE_UPWORK_PROFILE' }, (response: ScrapeResponse | undefined) => {
      const runtimeError = chrome.runtime.lastError;
      if (runtimeError) {
        reject(new Error('Refresh the Upwork profile page, then try again.'));
        return;
      }
      if (!response?.ok) {
        reject(new Error(response?.error || 'Could not read this Upwork profile.'));
        return;
      }
      resolve(response.profile);
    });
  });
}

export async function scrapeActivePortfolioProject(tab: chrome.tabs.Tab): Promise<ScrapedPortfolioProject> {
  const tabId = tab.id;
  if (!tabId) throw new Error('Open an Upwork portfolio project first.');

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId,
      { type: 'SCRAPE_UPWORK_PORTFOLIO_PROJECT' },
      (response: ScrapePortfolioResponse | undefined) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error('Refresh the Upwork page, then try again.'));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || 'Could not read this portfolio project.'));
          return;
        }
        resolve(response.project);
      },
    );
  });
}
