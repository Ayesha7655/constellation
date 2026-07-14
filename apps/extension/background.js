importScripts('config.js');

function defaultApiUrl() {
  return globalThis.CONSTELLATION_EXTENSION_CONFIG?.API_URL || 'http://localhost:4050/api';
}

chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== 'CONSTELLATION_PAIR') {
    sendResponse({ ok: false });
    return false;
  }
  chrome.storage.local.set(
    {
      accessToken: message.accessToken,
      refreshToken: message.refreshToken,
      apiUrl: message.apiUrl || defaultApiUrl(),
    },
    () => {
      sendResponse({ ok: true });
    },
  );
  return true;
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'GET_SESSION') {
    chrome.storage.local.get(['accessToken', 'refreshToken', 'apiUrl'], (result) => {
      sendResponse(result);
    });
    return true;
  }
  return false;
});
