'use client';

import { useSyncExternalStore } from 'react';
import { getCurrentRole } from '@/lib/auth-role';

function subscribeAuthRole(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange();
  window.addEventListener('constellation:auth-session-change', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('constellation:auth-session-change', handler);
    window.removeEventListener('storage', handler);
  };
}

export function useAuthRole(): string | null {
  return useSyncExternalStore(subscribeAuthRole, getCurrentRole, () => null);
}
