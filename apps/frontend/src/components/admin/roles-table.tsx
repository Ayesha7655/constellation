'use client';

import { useCallback, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { RolePermissionsDialog } from '@/components/admin/role-permissions-dialog';
import { DataTable, dataTableColumnWidth, type DataTableColumn } from '@constellation/shared/ui';
import { TEST_IDS } from '@constellation/shared';
import { cn } from '@/lib/utils';
import type { RoleSummary } from '@/types/admin';

type RolesTableProps = Readonly<{
  roles: readonly RoleSummary[];
}>;

export function RolesTable({ roles }: RolesTableProps) {
  const t = useTranslations('dashboard.admin.accessControl');
  const [selectedRole, setSelectedRole] = useState<RoleSummary | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const onRowClick = useCallback((role: RoleSummary) => {
    setSelectedRole(role);
    setDialogOpen(true);
  }, []);

  const onDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedRole(null);
    }
  }, []);

  const columns = useMemo(
    (): readonly DataTableColumn<RoleSummary>[] => [
      {
        id: 'displayName',
        header: t('table.role'),
        widthClassName: 'w-[45%]',
        cell: (role) => <span className="font-medium">{role.displayName}</span>,
      },
      {
        id: 'permissionCount',
        header: t('table.permissions'),
        widthClassName: 'w-[45%]',
        cell: (role) => role.permissionCount,
        cellClassName: 'text-muted-foreground',
      },
      {
        id: 'action',
        header: '',
        widthClassName: dataTableColumnWidth.actionsIcons,
        cellClassName: 'text-muted-foreground',
        cell: () => <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />,
      },
    ],
    [t],
  );

  return (
    <>
      <div className="flex flex-col gap-2 md:hidden">
        {roles.length === 0 ? (
          <p className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted-foreground">
            {t('table.empty')}
          </p>
        ) : (
          roles.map((role) => (
            <button
              key={role.key}
              type="button"
              data-testid={TEST_IDS.roles.row(role.key)}
              onClick={() => onRowClick(role)}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-start',
                'transition-colors hover:bg-muted/50',
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">{role.displayName}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {t('table.permissionCount', { count: role.permissionCount })}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" aria-hidden />
            </button>
          ))
        )}
      </div>

      <div className="hidden md:block">
        <DataTable
          columns={columns}
          rows={roles}
          getRowKey={(role) => role.key}
          onRowClick={onRowClick}
          emptyMessage={t('table.empty')}
        />
      </div>

      <RolePermissionsDialog role={selectedRole} open={dialogOpen} onOpenChange={onDialogOpenChange} />
    </>
  );
}
