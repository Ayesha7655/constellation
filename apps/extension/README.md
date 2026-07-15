# Constellation Chrome extension (MV3)

The popup is a React + TypeScript app built with Vite. Chrome background and Upwork content scripts stay as
small, isolated MV3 scripts under `public/`.

The React source mirrors the web app boundaries:

- `components/screens` — mutually exclusive popup screens selected by an exhaustive switch
- `components/layout` — popup chrome and feedback
- `hooks` — connection and sync orchestration
- `services` — backend HTTP calls and token refresh
- `lib` — Chrome tab, config, and storage utilities
- `types` — extension contracts and state
- `public/scraper/selectors.js` — ordered, editable Upwork selector fallbacks
- `public/scraper/extractor.js` — generic extraction, normalization, and diagnostics

## Upwork scraper

Chrome loads `selectors.js`, `extractor.js`, and then `content.js`. For each field or collection, the extractor
tries the configured selectors in order and uses the first non-empty result. Keep stable semantic attributes
(`data-test`, `data-cy`, `itemprop`, section IDs, and metadata) before class-based fallbacks.

The same selector set supports public visitor profiles and the freelancer's logged-in owner view. The import
contract contains the core profile fields. Additional details such as profile identity, local time, ratings,
metrics, availability, response time, work history, portfolio, feedback, education, employment, certifications,
Project Catalog entries, linked accounts, and selector diagnostics are retained in `rawSnapshot`. Owner-only
navigation and account controls such as Connects are deliberately excluded.

Validate selector changes against HTML saved from an Upwork profile:

```bash
pnpm --filter extension validate:scraper -- path/to/profile.html
```

The report shows extracted values, collection counts, matched selectors, missing optional sections, and invalid
selectors. A missing section is expected when that profile does not publish the corresponding information.

## Develop

```bash
pnpm --filter extension dev
```

This watches the app and writes the loadable extension to `apps/extension/dist`. After a rebuild, press
**Reload** for the extension in `chrome://extensions`.

For a one-off production build:

```bash
pnpm --filter extension build
```

## Static extension ID

The public manifest includes a key so Chrome assigns this fixed ID:

```
binnbooceccibooedcfekgeackgnkodh
```

Set the same value as `NEXT_PUBLIC_CHROME_EXTENSION_ID` in `apps/frontend/.env.local`.

## Config

Chrome extensions cannot load `.env` files. Local settings live in the ignored `config.js` file and are copied
to `dist` during each build.

- `API_URL`: Nest API base including `/api`
- `WEB_URL`: frontend origin
- `EXTENSION_ID`: documents the stable ID and must match the manifest key

```bash
cp apps/extension/config.example.js apps/extension/config.js
# edit API_URL / WEB_URL if your ports differ
```

If hosts or ports change, also update `host_permissions` and `externally_connectable` in
`public/manifest.json`.

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Run `pnpm --filter extension build`
4. **Load unpacked** → select `apps/extension/dist`
5. Confirm the ID shows as `binnbooceccibooedcfekgeackgnkodh`
6. Dashboard → **Connect extension** → one-click or pairing code
7. Open an Upwork freelancer profile → extension popup → **Sync profile**
8. Review and confirm the draft in **Upwork profiles**
