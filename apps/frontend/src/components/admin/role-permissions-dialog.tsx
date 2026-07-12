'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@constellation/shared/ui';
import type { RolePermission, RoleSummary } from '@/types/admin';

type RolePermissionsDialogProps = Readonly<{
  role: RoleSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

type PermissionGroup = Readonly<{
  category: string;
  categoryLabel: string;
  permissions: readonly RolePermission[];
}>;

const CATEGORY_SORT_ORDER: Readonly<Record<string, number>> = {
  browsing_discovery: 1,
  transactions: 2,
  listings_management: 3,
  lead_management: 4,
  inspection: 5,
  verification_trust: 6,
  company_profile_catalogue: 7,
  communication: 8,
  account_settings: 9,
  admin_controls: 10,
  catalog_management: 11,
};

function categorySortOrder(category: string): number {
  return CATEGORY_SORT_ORDER[category] ?? 99;
}

function groupPermissions(permissions: readonly RolePermission[]): readonly PermissionGroup[] {
  const groups = new Map<string, PermissionGroup>();
  for (const permission of permissions) {
    const existing = groups.get(permission.category);
    if (existing) {
      groups.set(permission.category, {
        ...existing,
        permissions: [...existing.permissions, permission],
      });
      continue;
    }
    groups.set(permission.category, {
      category: permission.category,
      categoryLabel: permission.categoryLabel,
      permissions: [permission],
    });
  }
  return [...groups.values()].sort(
    (left, right) => categorySortOrder(left.category) - categorySortOrder(right.category),
  );
}

export function RolePermissionsDialog({ role, open, onOpenChange }: RolePermissionsDialogProps) {
  const t = useTranslations('dashboard.admin.accessControl');

  const groups = useMemo(
    () => (role ? groupPermissions(role.permissions) : []),
    [role],
  );

  if (!role) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={role.displayName}
      description={t('permissionsDialog.description', { count: role.permissionCount })}
      size="lg"
    >
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <section key={group.category} className="flex flex-col gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {group.categoryLabel}
            </h3>
            <ul className="flex flex-col gap-2">
              {group.permissions.map((permission) => (
                <li
                  key={permission.key}
                  className="rounded-md border border-border bg-muted/20 px-3 py-2"
                >
                  <p className="text-sm font-medium text-foreground">{permission.name}</p>
                  {permission.description ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{permission.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
