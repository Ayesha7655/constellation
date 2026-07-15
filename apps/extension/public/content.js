chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'SCRAPE_UPWORK_PROFILE') return false;

  const scraper = globalThis.CONSTELLATION_UPWORK_SCRAPER;
  if (!scraper?.scrapeProfile) {
    sendResponse({ ok: false, error: 'Upwork profile scraper is unavailable' });
    return false;
  }

  void scraper.scrapeProfile().then(
    (profile) => sendResponse({ ok: true, profile }),
    (error) => {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) });
    },
  );

  return true;
});
