const DEVICE_ID_KEY = 'constellation:device-id';

function createDeviceId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const id = createDeviceId();
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}
