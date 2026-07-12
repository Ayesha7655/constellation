'use client';

import { useEffect } from 'react';
import { resolveDashboardProfilePathFromHome } from '@constellation/shared';
import { useRouter } from '@/i18n/navigation';
import { getAccessToken, getDashboardHomePath } from '@/lib/auth-session';
import { probeAuthSession } from '@/services/auth-api';

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!getAccessToken()) {
        router.replace('/sign-in');
        return;
      }

      const storedHomePath = getDashboardHomePath();
      if (storedHomePath) {
        if (!cancelled) {
          router.replace(resolveDashboardProfilePathFromHome(storedHomePath));
        }
        return;
      }

      const user = await probeAuthSession();
      if (cancelled) {
        return;
      }

      if (!user) {
        router.replace('/sign-in');
        return;
      }

      router.replace(resolveDashboardProfilePathFromHome(user.dashboardHomePath));
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
