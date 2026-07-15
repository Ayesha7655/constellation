const DEFAULT_API_URL = 'http://localhost:4050/api';
const DEFAULT_WEB_URL = 'http://localhost:4000';

export function getDefaultApiUrl(): string {
  return globalThis.CONSTELLATION_EXTENSION_CONFIG?.API_URL?.replace(/\/$/, '') || DEFAULT_API_URL;
}

export function getWebUrl(): string {
  return globalThis.CONSTELLATION_EXTENSION_CONFIG?.WEB_URL?.replace(/\/$/, '') || DEFAULT_WEB_URL;
}
