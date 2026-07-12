'use client';

import { useSyncExternalStore } from 'react';
import { decodeJwtPayload, getAccessToken } from '@/lib/auth-session';

function getAuthLabelSnapshot(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (typeof payload?.name === 'string') return payload.name;
  if (typeof payload?.email === 'string') return payload.email;
  return 'Account';
}

function subscribeAuthLabel(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange();
  window.addEventListener('constellation:auth-session-change', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('constellation:auth-session-change', handler);
    window.removeEventListener('storage', handler);
  };
}

export function useAuthLabel(): string | null {
  return useSyncExternalStore(
    subscribeAuthLabel,
    getAuthLabelSnapshot,
    () => null,
  );
}
