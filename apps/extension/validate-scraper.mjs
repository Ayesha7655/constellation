import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { JSDOM, VirtualConsole } from 'jsdom';

const htmlPath = process.argv[2];

if (!htmlPath) {
  throw new Error('Usage: pnpm validate:scraper -- <saved-profile.html>');
}

const extensionRoot = resolve(import.meta.dirname);
const [html, selectorsSource, extractorSource] = await Promise.all([
  readFile(resolve(htmlPath), 'utf8'),
  readFile(resolve(extensionRoot, 'public/scraper/selectors.js'), 'utf8'),
  readFile(resolve(extensionRoot, 'public/scraper/extractor.js'), 'utf8'),
]);
const canonicalUrlMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
const pageUrl = canonicalUrlMatch?.[1] ?? 'https://www.upwork.com/freelancers/example';
const virtualConsole = new VirtualConsole();
const dom = new JSDOM(html, {
  url: pageUrl,
  runScripts: 'outside-only',
  virtualConsole,
});

dom.window.eval(selectorsSource);
dom.window.eval(extractorSource);

const profile = await dom.window.CONSTELLATION_UPWORK_SCRAPER.scrapeProfile();
const serializedProfile = JSON.stringify(profile);
const escapedSurrogate = /\\u(?:d[89ab][0-9a-f]{2}|d[c-f][0-9a-f]{2})/i.exec(serializedProfile);

if (escapedSurrogate) {
  throw new Error(`Scraped JSON contains an unmatched Unicode surrogate: ${escapedSurrogate[0]}`);
}

const rawProfile = profile.rawSnapshot.profile;
const extraction = profile.rawSnapshot.extraction;

console.log(
  JSON.stringify(
    {
      selectorVersion: extraction.selectorVersion,
      viewMode: profile.rawSnapshot.viewMode,
      name: rawProfile.name,
      title: profile.title,
      country: profile.country,
      city: rawProfile.city,
      hourlyRateMin: profile.hourlyRateMin,
      skills: profile.skills,
      languages: profile.languages,
      availabilityHours: rawProfile.availabilityHours,
      contractToHire: rawProfile.contractToHire,
      responseTime: rawProfile.responseTime,
      metrics: rawProfile.metrics,
      workHistoryCount: profile.rawSnapshot.workHistory.length,
      portfolioCount: profile.rawSnapshot.portfolio.length,
      feedbackCount: profile.rawSnapshot.clientFeedback.length,
      educationCount: profile.rawSnapshot.education.length,
      employmentCount: profile.rawSnapshot.employment.length,
      certificationCount: profile.rawSnapshot.certifications.length,
      projectCatalogCount: profile.rawSnapshot.projectCatalog.length,
      linkedAccountCount: profile.rawSnapshot.linkedAccounts.length,
      missing: extraction.missing,
      invalidSelectors: extraction.invalidSelectors,
      matches: extraction.matches,
    },
    null,
    2,
  ),
);
