'use client';

import { StatusBadge } from '@constellation/shared/ui';
import { mergeUserRolesForDisplay, userRoleBadgeVariant } from '@/lib/user-display';
import type { AdminUserSummary } from '@/types/admin-users';

type UserTableAccessCellProps = Readonly<{
  user: AdminUserSummary;
}>;

export function UserTableAccessCell({ user }: UserTableAccessCellProps) {
  const displayRoles = mergeUserRolesForDisplay(user);

  if (displayRoles.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1">
        {displayRoles.map((role) => (
          <StatusBadge
            key={role.key}
            label={role.label}
            variant={userRoleBadgeVariant(role.key, user.primaryRole.key)}
          />
        ))}
      </div>
      {user.orgName ? <span className="text-xs text-muted-foreground">{user.orgName}</span> : null}
    </div>
  );
}
