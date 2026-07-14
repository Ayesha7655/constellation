/**
 * Constellation Chrome extension — local config.
 * Copy from config.example.js if missing, then edit values for your environment.
 *
 * Chrome MV3 has no .env loader; this file is the equivalent.
 * After changing API/WEB hosts, also update host_permissions / externally_connectable
 * in manifest.json, then reload the extension on chrome://extensions.
 */
globalThis.CONSTELLATION_EXTENSION_CONFIG = {
  /** Nest API base including `/api` prefix */
  // API_URL: 'http://localhost:4050/api',
  API_URL: 'http://localhost:6051/api',

  /** Frontend origin (one-click connect / docs). Must match manifest externally_connectable. */
  WEB_URL: 'http://localhost:6050',

  /**
   * Stable extension ID from manifest `key` (same on every machine once key is set).
   * Must match NEXT_PUBLIC_CHROME_EXTENSION_ID on the frontend.
   */
  EXTENSION_ID: 'binnbooceccibooedcfekgeackgnkodh',
};
