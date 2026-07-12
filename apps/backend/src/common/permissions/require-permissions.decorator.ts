import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '@constellation/shared';

export const REQUIRE_PERMISSIONS_KEY = 'requirePermissions';

/** Permission keys required to access the route (all must be granted for the JWT active role). */
export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);
