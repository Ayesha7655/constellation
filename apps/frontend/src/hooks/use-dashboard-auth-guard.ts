'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { getAccessToken } from '@/lib/auth-session';
import { validateDashboardSession } from '@/lib/validate-dashboard-session';
import type { CurrentUser } from '@/services/auth-api';

export type DashboardGuardState = 'loading' | 'authorized' | 'error';

type UseDashboardAuthGuardResult = Readonly<{
  state: DashboardGuardState;
  user: CurrentUser | null;
  onRetry: () => void;
}>;

type GuardOptions = Readonly<{
  skipOrgOnboardingGate?: boolean;
}>;

function resolveValidationResult(
  result: Awaited<ReturnType<typeof validateDashboardSession>>,
  router: ReturnType<typeof useRouter>,
  active: boolean,
): Pick<UseDashboardAuthGuardResult, 'state' | 'user'> | null {
  if (!active) {
    return null;
  }

  if (result.status === 'sign-in') {
    router.replace('/sign-in');
    return null;
  }

  if (result.status === 'redirect') {
    router.replace(result.path);
    return null;
  }

  if (result.status === 'error') {
    return { state: 'error', user: null };
  }

  return { state: 'authorized', user: result.user };
}

export function useDashboardAuthGuard(
  allowedRoleKeys: readonly string[],
  options?: GuardOptions,
): UseDashboardAuthGuardResult {
  const router = useRouter();
  const [state, setState] = useState<DashboardGuardState>('loading');
  const [user, setUser] = useState<CurrentUser | null>(null);

  const onRetry = useCallback(() => {
    setState('loading');

    void (async () => {
      const resolved = resolveValidationResult(
        await validateDashboardSession(allowedRoleKeys, {
          skipOrgOnboardingGate: options?.skipOrgOnboardingGate,
        }),
        router,
        true,
      );
      if (!resolved) {
        return;
      }
      setUser(resolved.user);
      setState(resolved.state);
    })();
  }, [allowedRoleKeys, options?.skipOrgOnboardingGate, router]);

  useEffect(() => {
    let active = true;

    const validate = async () => {
      const resolved = resolveValidationResult(
        await validateDashboardSession(allowedRoleKeys, {
          skipOrgOnboardingGate: options?.skipOrgOnboardingGate,
        }),
        router,
        active,
      );
      if (!resolved) {
        return;
      }
      setUser(resolved.user);
      setState(resolved.state);
    };

    void validate();

    const onSessionChange = () => {
      if (!getAccessToken()) {
        return;
      }

      setState('loading');
      void validate();
    };

    window.addEventListener('constellation:auth-session-change', onSessionChange);
    return () => {
      active = false;
      window.removeEventListener('constellation:auth-session-change', onSessionChange);
    };
  }, [allowedRoleKeys, options?.skipOrgOnboardingGate, router]);

  return { state, user, onRetry };
}
