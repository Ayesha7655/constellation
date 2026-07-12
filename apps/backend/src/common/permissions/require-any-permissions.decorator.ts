import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '@constellation/shared';

export const REQUIRE_ANY_PERMISSIONS_KEY = 'requireAnyPermissions';

/** Primary-role permission keys where at least one grant is required. */
export const RequireAnyPermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(REQUIRE_ANY_PERMISSIONS_KEY, permissions);
