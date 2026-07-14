# Constellation Chrome extension (MV3)

Chrome extensions cannot load `.env` files. Local settings live in **`config.js`** (same idea as env vars).

## Static extension ID

`manifest.json` includes a public `key` so Chrome assigns a **fixed ID** on every machine:

```
binnbooceccibooedcfekgeackgnkodh
```

Set the same value as `NEXT_PUBLIC_CHROME_EXTENSION_ID` in `apps/frontend/.env.local` (already the default in `.env.example` and the UI fallback).

**Important:** If you already loaded the extension before this `key` existed, remove it from `chrome://extensions` and **Load unpacked** again so Chrome picks up the stable ID.

## Config

| Key | Where | Purpose |
|-----|--------|---------|
| `API_URL` | `apps/extension/config.js` | Nest API base including `/api` |
| `WEB_URL` | `apps/extension/config.js` | Frontend origin |
| `EXTENSION_ID` | `apps/extension/config.js` | Documents the stable ID (must match manifest `key`) |
| `NEXT_PUBLIC_CHROME_EXTENSION_ID` | `apps/frontend/.env.local` | Used for dashboard one-click connect |
| `NEXT_PUBLIC_API_URL` | `apps/frontend/.env.local` | Sent to the extension on one-click pair |

```bash
cp apps/extension/config.example.js apps/extension/config.js
# edit API_URL / WEB_URL if your ports differ
```

If you change API/WEB hosts or ports, also update `host_permissions` and `externally_connectable` in `manifest.json`, then **Reload** the extension.

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this folder (`apps/extension`)
4. Confirm the ID shows as `binnbooceccibooedcfekgeackgnkodh`
5. Ensure `NEXT_PUBLIC_CHROME_EXTENSION_ID=binnbooceccibooedcfekgeackgnkodh` in frontend env (restart frontend if you just set it)
6. Dashboard → **Connect extension** → one-click or pairing code
7. Open your Upwork profile → extension popup → **Sync profile**
8. Confirm the draft on **Freelancer profile**
