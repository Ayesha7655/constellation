function textOf(selector) {
  const el = document.querySelector(selector);
  return el?.textContent?.trim() || null;
}

function collectSkills() {
  const nodes = Array.from(document.querySelectorAll('[data-test="skill"], .skill-name, [data-cy="skill-item"]'));
  const fromDom = nodes.map((n) => n.textContent?.trim()).filter(Boolean);
  if (fromDom.length) return fromDom;

  const chipNodes = Array.from(document.querySelectorAll('span, a')).filter((el) => {
    const cls = el.className?.toString?.() ?? '';
    return cls.toLowerCase().includes('skill') && (el.textContent?.trim().length ?? 0) < 40;
  });
  return [...new Set(chipNodes.map((n) => n.textContent.trim()).filter(Boolean))].slice(0, 40);
}

function scrapeProfile() {
  const title =
    textOf('h1') ||
    textOf('[data-test="freelancer-title"]') ||
    textOf('[data-cy="title"]');
  const overview =
    textOf('[data-test="description"]') ||
    textOf('[data-cy="air3-line-clamp"]') ||
    textOf('section[data-test="profile-overview"]') ||
    textOf('.air3-card-section p');

  const rateText =
    textOf('[data-test="hourly-rate"]') ||
    textOf('[data-cy="freelancer-rate"]') ||
    Array.from(document.querySelectorAll('strong, span'))
      .map((n) => n.textContent?.trim() ?? '')
      .find((t) => /^\$?\d+(\.\d+)?(\s*-\s*\$?\d+(\.\d+)?)?\s*\/\s*hr/i.test(t)) ||
    null;

  let hourlyRateMin = null;
  let hourlyRateMax = null;
  if (rateText) {
    const nums = rateText.replace(/,/g, '').match(/\d+(\.\d+)?/g);
    if (nums?.length === 1) {
      hourlyRateMin = Math.round(Number(nums[0]));
      hourlyRateMax = hourlyRateMin;
    } else if (nums && nums.length >= 2) {
      hourlyRateMin = Math.round(Number(nums[0]));
      hourlyRateMax = Math.round(Number(nums[1]));
    }
  }

  return {
    title,
    overview,
    skills: collectSkills(),
    hourlyRateMin,
    hourlyRateMax,
    country: textOf('[data-test="location"]') || textOf('[itemprop="addressCountry"]'),
    timezone: null,
    languages: [],
    exclusions: [],
    profileUrl: window.location.href.split('?')[0],
    rawSnapshot: {
      pageTitle: document.title,
      url: window.location.href,
      scrapedAt: new Date().toISOString(),
    },
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'SCRAPE_UPWORK_PROFILE') {
    return false;
  }
  try {
    sendResponse({ ok: true, profile: scrapeProfile() });
  } catch (error) {
    sendResponse({ ok: false, error: String(error) });
  }
  return true;
});
