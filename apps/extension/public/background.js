importScripts('config.js');

function defaultApiUrl() {
  return globalThis.CONSTELLATION_EXTENSION_CONFIG?.API_URL || 'http://localhost:4050/api';
}

function isPairMessage(message) {
  return (
    message?.type === 'CONSTELLATION_PAIR' &&
    typeof message.accessToken === 'string' &&
    typeof message.refreshToken === 'string'
  );
}

chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (!isPairMessage(message)) {
    sendResponse({ ok: false });
    return false;
  }

  chrome.storage.local.set(
    {
      accessToken: message.accessToken,
      refreshToken: message.refreshToken,
      apiUrl: message.apiUrl || defaultApiUrl(),
    },
    () => sendResponse({ ok: !chrome.runtime.lastError }),
  );
  return true;
});
