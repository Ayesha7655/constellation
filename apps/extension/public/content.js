chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const scraper = globalThis.CONSTELLATION_UPWORK_SCRAPER;

  if (message?.type === 'SCRAPE_UPWORK_PROFILE') {
    if (!scraper?.scrapeProfile) {
      console.error('[constellation:portfolio] profile scraper missing on page', {
        href: window.location.href,
        hasScraper: Boolean(scraper),
      });
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
      console.error('[constellation:portfolio] portfolio scraper missing on page', {
        href: window.location.href,
        hasScraper: Boolean(scraper),
        scraperKeys: scraper ? Object.keys(scraper) : [],
      });
      sendResponse({ ok: false, error: 'Upwork portfolio scraper is unavailable' });
      return false;
    }
    console.info('[constellation:portfolio] content scrape start', { href: window.location.href });
    void scraper.scrapePortfolioProject().then(
      (project) => {
        console.info('[constellation:portfolio] content scrape ok', {
          externalId: project?.externalId,
          profileUrl: project?.profileUrl,
          projectUrl: project?.projectUrl,
          title: project?.title,
        });
        sendResponse({ ok: true, project });
      },
      (error) => {
        console.error('[constellation:portfolio] content scrape failed', {
          href: window.location.href,
          error: error instanceof Error ? error.message : String(error),
        });
        sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) });
      },
    );
    return true;
  }

  return false;
});
