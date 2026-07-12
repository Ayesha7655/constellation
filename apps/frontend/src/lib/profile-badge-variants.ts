import { ORG_ADMIN_ROLE_KEY, SUPER_ADMIN_ROLE_KEY, USER_ROLE_KEY } from '@constellation/shared';
import type { StatusBadgeVariant } from '@constellation/shared/ui';
import type { AuthProvider } from '@/services/auth-api';

export function roleStatusBadgeVariant(roleCode: string): StatusBadgeVariant {
  if (roleCode === SUPER_ADMIN_ROLE_KEY) {
    return 'admin';
  }
  if (roleCode === ORG_ADMIN_ROLE_KEY) {
    return 'primary';
  }
  if (roleCode === USER_ROLE_KEY) {
    return 'secondary';
  }
  return 'secondary';
}

export function authProviderBadgeVariant(provider: AuthProvider): StatusBadgeVariant {
  switch (provider) {
    case 'GOOGLE':
      return 'authGoogle';
    case 'APPLE':
      return 'authApple';
    default:
      return 'authPassword';
  }
}
