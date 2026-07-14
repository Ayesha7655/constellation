function uuid() {
  return crypto.randomUUID();
}

function defaultApiUrl() {
  return globalThis.CONSTELLATION_EXTENSION_CONFIG?.API_URL || 'http://localhost:4050/api';
}

function setStatus(text) {
  document.getElementById('status').textContent = text;
}

async function getSession() {
  return chrome.storage.local.get(['accessToken', 'refreshToken', 'apiUrl', 'deviceId']);
}

async function ensureDeviceId(session) {
  if (session.deviceId) return session.deviceId;
  const deviceId = uuid();
  await chrome.storage.local.set({ deviceId });
  return deviceId;
}

async function resolveApiUrl(session) {
  return session.apiUrl || defaultApiUrl();
}

document.getElementById('pair').addEventListener('click', async () => {
  const code = document.getElementById('code').value.trim();
  if (!/^\d{6}$/.test(code)) {
    setStatus('Enter a valid 6-digit code.');
    return;
  }
  const session = await getSession();
  const apiUrl = await resolveApiUrl(session);
  const deviceId = await ensureDeviceId(session);
  setStatus('Pairing…');
  try {
    const response = await fetch(`${apiUrl}/extension/pair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
      },
      body: JSON.stringify({ code }),
    });
    const body = await response.json();
    if (!response.ok) {
      setStatus(`Pair failed (${response.status}): ${body.code || JSON.stringify(body)}`);
      return;
    }
    await chrome.storage.local.set({
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      apiUrl,
      deviceId,
    });
    setStatus('Connected. Open your Upwork profile and press Sync.');
  } catch (error) {
    setStatus(String(error));
  }
});

document.getElementById('sync').addEventListener('click', async () => {
  const session = await getSession();
  if (!session.accessToken) {
    setStatus('Not connected. Pair first.');
    return;
  }
  const apiUrl = await resolveApiUrl(session);
  const deviceId = await ensureDeviceId(session);
  setStatus('Scraping active tab…');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.includes('upwork.com')) {
    setStatus('Open your Upwork profile page first.');
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_UPWORK_PROFILE' }, async (response) => {
    if (chrome.runtime.lastError) {
      setStatus(chrome.runtime.lastError.message || 'Content script unavailable. Refresh the Upwork page.');
      return;
    }
    if (!response?.ok) {
      setStatus(response?.error || 'Scrape failed.');
      return;
    }
    setStatus('Uploading draft…');
    try {
      const res = await fetch(`${apiUrl}/organizations/me/freelancer-profile/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
          'x-device-id': deviceId,
        },
        body: JSON.stringify(response.profile),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(`Import failed (${res.status}): ${body.code || JSON.stringify(body)}`);
        return;
      }
      setStatus('Draft imported. Confirm it in the Constellation dashboard.');
    } catch (error) {
      setStatus(String(error));
    }
  });
});
