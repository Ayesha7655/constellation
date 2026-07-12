import { SUPER_ADMIN_ROLE_KEY } from '@/lib/roles';
import { clearClientAuthSession } from '@/lib/clear-client-auth';
import { getAccessToken, getDashboardHomePath, isAccessTokenExpired } from '@/lib/auth-session';
import { probeAuthSession, type CurrentUser } from '@/services/auth-api';

export type DashboardSessionValidationResult =
  | Readonly<{ status: 'authorized'; user: CurrentUser }>
  | Readonly<{ status: 'sign-in' }>
  | Readonly<{ status: 'redirect'; path: string }>
  | Readonly<{ status: 'error' }>;

const ONBOARDING_ORG_PATH = '/onboarding/org';

function needsOrgOnboarding(user: CurrentUser): boolean {
  return user.activeRoleKey !== SUPER_ADMIN_ROLE_KEY && !user.orgProfileComplete;
}

export async function validateDashboardSession(
  allowedRoleKeys: readonly string[],
  options?: Readonly<{ skipOrgOnboardingGate?: boolean }>,
): Promise<DashboardSessionValidationResult> {
  const token = getAccessToken();
  if (!token || isAccessTokenExpired(token)) {
    if (token) {
      await clearClientAuthSession();
    }
    return { status: 'sign-in' };
  }

  try {
    const currentUser = await probeAuthSession();
    if (!currentUser) {
      await clearClientAuthSession();
      return { status: 'sign-in' };
    }

    if (!options?.skipOrgOnboardingGate && needsOrgOnboarding(currentUser)) {
      return { status: 'redirect', path: ONBOARDING_ORG_PATH };
    }

    if (!allowedRoleKeys.includes(currentUser.activeRoleKey)) {
      return {
        status: 'redirect',
        path: currentUser.dashboardHomePath || getDashboardHomePath() || '/',
      };
    }

    if (!options?.skipOrgOnboardingGate && needsOrgOnboarding(currentUser)) {
      return { status: 'redirect', path: ONBOARDING_ORG_PATH };
    }

    return { status: 'authorized', user: currentUser };
  } catch {
    return { status: 'error' };
  }
}
