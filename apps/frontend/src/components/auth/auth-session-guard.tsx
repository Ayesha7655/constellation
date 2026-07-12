'use client';

import { useEffect } from 'react';
import { clearClientAuthSession } from '@/lib/clear-client-auth';
import { getAccessToken } from '@/lib/auth-session';
import { probeAuthSession } from '@/services/auth-api';

export function AuthSessionGuard() {
  useEffect(() => {
    const validateSession = async () => {
      if (!getAccessToken()) {
        return;
      }
      try {
        const user = await probeAuthSession();
        if (!user) {
          await clearClientAuthSession();
        }
      } catch {
        /* Keep local session on transient network/server errors. */
      }
    };

    void validateSession();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void validateSession();
      }
    };

    const onWindowFocus = () => {
      void validateSession();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onWindowFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, []);

  return null;
}
