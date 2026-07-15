import type { ScrapedProfile } from '../types';

type ScrapeResponse = Readonly<{ ok: true; profile: ScrapedProfile }> | Readonly<{ ok: false; error?: string }>;

export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

export function isUpworkProfileTab(tab: chrome.tabs.Tab | null): boolean {
  if (!tab?.id || !tab.url) return false;
  try {
    const url = new URL(tab.url);
    const isUpworkHost = url.hostname === 'upwork.com' || url.hostname.endsWith('.upwork.com');
    return isUpworkHost && url.pathname.startsWith('/freelancers/');
  } catch {
    return false;
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
