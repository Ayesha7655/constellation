chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const scraper = globalThis.CONSTELLATION_UPWORK_SCRAPER;

  if (message?.type === 'SCRAPE_UPWORK_PROFILE') {
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
  }

  if (message?.type === 'SCRAPE_UPWORK_PORTFOLIO_PROJECT') {
    if (!scraper?.scrapePortfolioProject) {
      sendResponse({ ok: false, error: 'Upwork portfolio scraper is unavailable' });
      return false;
    }
    void scraper.scrapePortfolioProject().then(
      (project) => sendResponse({ ok: true, project }),
      (error) => {
        sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) });
      },
    );
    return true;
  }

  return false;
});
