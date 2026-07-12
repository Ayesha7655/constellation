'use client';

import { useCallback, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LIST_TEXT_SEARCH_MAX_LENGTH, TEST_IDS } from '@constellation/shared';
import {
  Button,
  DataTable,
  dataTableColumnWidth,
  Dropdown,
  LoadingIndicator,
  PaginatedTableLayout,
  Pagination,
  StatusBadge,
  Tabs,
  type DataTableColumn,
  type DropdownOption,
  type TabItem,
} from '@constellation/shared/ui';
import { AdminListSearchField } from '@/components/admin/list/admin-list-search-field';
import { UserDetailPanel } from '@/components/admin/user-detail-panel';
import { UserTableAccessCell } from '@/components/admin/user-table-access-cell';
import { DetailRefreshButton } from '@/components/ui/detail-refresh-button';
import { AdminPageLayout } from '@/components/layout/admin-page-layout';
import type { AppLocale } from '@/i18n/config';
import { useAdminListSearch } from '@/hooks/use-admin-list-search';
import { useDashboardBreadcrumbs } from '@/hooks/use-dashboard-breadcrumbs';
import { useLocaleRefetch } from '@/hooks/use-locale-refetch';
import { DASHBOARD_BASE_PATH } from '@/lib/roles';
import { userDisplayName, userStatusVariant } from '@/lib/user-display';
import { getDefaultPageSize } from '@/lib/pagination';
import { listUserFilterRoles, listUsers } from '@/services/admin-api';
import type {
  AdminUserDetail,
  AdminUserRoleSummary,
  AdminUserSummary,
  UserRoleFilter,
  UserStatusFilter,
} from '@/types/admin-users';
import type { PaginationMeta } from '@/types/pagination';

const LIST_PAGE_SIZE = getDefaultPageSize();
const STATUS_TABS: readonly UserStatusFilter[] = ['ALL', 'ACTIVE', 'DEACTIVATED'];

type LoadState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error' }>
  | Readonly<{ status: 'ready'; users: readonly AdminUserSummary[]; meta: PaginationMeta }>;

type RoleOptionsState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'ready'; roles: readonly AdminUserRoleSummary[] }>;

async function fetchUsers(
  locale: AppLocale,
  statusFilter: UserStatusFilter,
  roleFilter: UserRoleFilter,
  page: number,
  limit: number,
  q: string,
): Promise<LoadState> {
  try {
    const response = await listUsers({
      locale,
      page,
      limit,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      roleKey: roleFilter === 'ALL' ? undefined : roleFilter,
      q: q.trim() || undefined,
    });
    return { status: 'ready', users: response.users, meta: response.meta };
  } catch {
    return { status: 'error' };
  }
}

type ViewUserButtonProps = Readonly<{
  label: string;
  user: AdminUserSummary;
  onView: (user: AdminUserSummary) => void;
}>;

function ViewUserButton({ label, user, onView }: ViewUserButtonProps) {
  const onClick = useCallback(() => {
    onView(user);
  }, [onView, user]);

  return (
    <button
      type="button"
      data-testid={TEST_IDS.users.view(user.id)}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={label}
      onClick={onClick}
    >
      <Eye className="size-4" aria-hidden />
    </button>
  );
}

export function UsersView() {
  const t = useTranslations('dashboard.admin.users');
  const tControls = useTranslations('dashboard.admin.listControls');
  const tDashboard = useTranslations('dashboard');

  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('ALL');
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>('ALL');
  const [page, setPage] = useState(1);
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [roleOptionsState, setRoleOptionsState] = useState<RoleOptionsState>({ status: 'loading' });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [panelUser, setPanelUser] = useState<AdminUserDetail | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const breadcrumbs = useMemo(() => {
    const items = [
      { label: tDashboard('admin.title'), href: DASHBOARD_BASE_PATH.superAdmin },
      { label: t('title'), href: `${DASHBOARD_BASE_PATH.superAdmin}/users` },
    ];
    if (panelOpen && selectedUserId) {
      items.push({
        label: panelUser ? userDisplayName(panelUser) : t('detail.title'),
        href: `${DASHBOARD_BASE_PATH.superAdmin}/users/${selectedUserId}`,
      });
    }
    return items;
  }, [panelOpen, panelUser, selectedUserId, t, tDashboard]);
  useDashboardBreadcrumbs(breadcrumbs);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);
  const { searchQuery, onSearchChange, hasActiveSearch, searchFieldKey } = useAdminListSearch(resetPage);

  const tabItems = useMemo(
    (): readonly TabItem<UserStatusFilter>[] =>
      STATUS_TABS.map((status) => ({
        value: status,
        label: t(`tabs.${status}`),
      })),
    [t],
  );

  const roleOptions = useMemo((): readonly DropdownOption<UserRoleFilter>[] => {
    const allOption: DropdownOption<UserRoleFilter> = {
      value: 'ALL',
      label: t('filters.roleAll'),
    };
    if (roleOptionsState.status !== 'ready') {
      return [allOption];
    }
    return [
      allOption,
      ...roleOptionsState.roles.map((role) => ({
        value: role.key,
        label: role.label,
      })),
    ];
  }, [roleOptionsState, t]);

  const loadRolesForLocale = useCallback(async (targetLocale: AppLocale, { isCancelled }: { isCancelled: () => boolean }) => {
    setRoleOptionsState({ status: 'loading' });
    try {
      const response = await listUserFilterRoles(targetLocale);
      if (!isCancelled()) {
        setRoleOptionsState({ status: 'ready', roles: response.roles });
      }
    } catch {
      if (!isCancelled()) {
        setRoleOptionsState({ status: 'ready', roles: [] });
      }
    }
  }, []);

  useLocaleRefetch(loadRolesForLocale);

  const loadForLocale = useCallback(
    async (targetLocale: AppLocale, { isCancelled }: { isCancelled: () => boolean }) => {
      setLoadState({ status: 'loading' });
      const next = await fetchUsers(targetLocale, statusFilter, roleFilter, page, LIST_PAGE_SIZE, searchQuery);
      if (!isCancelled()) {
        setLoadState(next);
      }
    },
    [page, roleFilter, searchQuery, statusFilter],
  );

  const locale = useLocaleRefetch(loadForLocale);

  const reloadList = useCallback(() => {
    void loadForLocale(locale, { isCancelled: () => false });
  }, [loadForLocale, locale]);

  const onRefreshClick = reloadList;

  const closePanel = useCallback(() => {
    setSelectedUserId(null);
    setPanelUser(null);
    setPanelOpen(false);
  }, []);

  const onPageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
    closePanel();
  }, [closePanel]);

  const onStatusFilterChange = useCallback((status: UserStatusFilter) => {
    setStatusFilter(status);
    setPage(1);
    closePanel();
  }, [closePanel]);

  const onRoleFilterChange = useCallback((next: UserRoleFilter) => {
    setRoleFilter(next);
    setPage(1);
    closePanel();
  }, [closePanel]);

  const onViewUser = useCallback((user: AdminUserSummary) => {
    setSelectedUserId(user.id);
    setPanelOpen(true);
  }, []);

  const onPanelOpenChange = useCallback((open: boolean) => {
    if (open) {
      setPanelOpen(true);
      return;
    }
    closePanel();
  }, [closePanel]);

  const onPanelUserChange = useCallback((user: AdminUserDetail | null) => {
    setPanelUser(user);
  }, []);

  const onRetryClick = useCallback(() => {
    reloadList();
  }, [reloadList]);

  const columns = useMemo(
    (): readonly DataTableColumn<AdminUserSummary>[] => [
      {
        id: 'user',
        header: t('table.user'),
        widthClassName: 'w-[38%]',
        cell: (row) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground">{row.name}</span>
            <span className="break-all text-sm text-muted-foreground">{row.email}</span>
          </div>
        ),
      },
      {
        id: 'access',
        header: t('table.access'),
        widthClassName: 'w-[28%]',
        cell: (row) => <UserTableAccessCell user={row} />,
      },
      {
        id: 'details',
        header: t('table.status'),
        widthClassName: dataTableColumnWidth.details,
        cell: (row) => (
          <div className="flex flex-col gap-1">
            <StatusBadge label={t(`status.${row.status}`)} variant={userStatusVariant(row.status)} />
            <span className="text-xs text-muted-foreground">
              {t('table.joinedAt', { date: new Date(row.createdAt).toLocaleDateString() })}
            </span>
            {row.lastLoginAt ? (
              <span className="text-xs text-muted-foreground">
                {t('table.lastLoginAt', { date: new Date(row.lastLoginAt).toLocaleDateString() })}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: 'actions',
        header: t('table.actions'),
        widthClassName: dataTableColumnWidth.actionsIcons,
        headerClassName: 'text-end',
        cellClassName: 'text-end',
        cell: (row) => (
          <div className="flex items-center justify-end">
            <ViewUserButton label={t('table.viewDetails')} user={row} onView={onViewUser} />
          </div>
        ),
      },
    ],
    [onViewUser, t],
  );

  const getRowKey = useCallback((row: AdminUserSummary) => row.id, []);

  const paginationPageLabel =
    loadState.status === 'ready'
      ? t('pagination.pageOf', { page: loadState.meta.page, totalPages: loadState.meta.totalPages })
      : '';

  return (
    <AdminPageLayout title={t('title')} description={t('description')} fillViewport>
      <Tabs
        items={tabItems}
        value={statusFilter}
        onChange={onStatusFilterChange}
        variant="underline"
        ariaLabel={t('tabsLabel')}
        className="shrink-0"
        testId={TEST_IDS.users.statusTabs}
      />

      <div className="flex shrink-0 flex-wrap items-end justify-end gap-4 pt-4 pb-4">
        <AdminListSearchField
          key={searchFieldKey}
          committedQuery={searchQuery}
          onDebouncedChange={onSearchChange}
          placeholder={tControls('searchPlaceholder')}
          ariaLabel={tControls('searchLabel')}
          maxLengthMessage={tControls('searchMaxLength', { max: LIST_TEXT_SEARCH_MAX_LENGTH })}
          testId={TEST_IDS.users.search}
        />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('filters.roleLabel')}
          </span>
          <Dropdown
            value={roleFilter}
            options={roleOptions}
            onChange={onRoleFilterChange}
            ariaLabel={t('filters.roleLabel')}
            testId={TEST_IDS.users.roleFilter}
          />
        </label>
        <DetailRefreshButton
          onRefresh={onRefreshClick}
          isRefreshing={loadState.status === 'loading'}
          ariaLabel={tControls('refreshLabel')}
          testId={TEST_IDS.users.refresh}
        />
      </div>

      {loadState.status === 'error' ? (
        <div className="flex shrink-0 flex-col items-start gap-3">
          <p className="text-sm text-destructive">{t('loadError')}</p>
          <Button variant="outline" fullWidth={false} onClick={onRetryClick} testId={TEST_IDS.users.retry}>
            {t('retry')}
          </Button>
        </div>
      ) : null}

      {loadState.status !== 'error' ? (
        <PaginatedTableLayout
          table={
            loadState.status === 'loading' ? (
              <LoadingIndicator label={tControls('loading')} className="min-h-full py-16" />
            ) : (
              <DataTable
                columns={columns}
                rows={loadState.users}
                getRowKey={getRowKey}
                emptyMessage={hasActiveSearch ? tControls('noResults') : t('table.empty')}
                scrollBody
              />
            )
          }
          pagination={
            loadState.status === 'ready' ? (
              <Pagination
                meta={loadState.meta}
                onPageChange={onPageChange}
                previousLabel={t('pagination.previous')}
                nextLabel={t('pagination.next')}
                pageLabel={paginationPageLabel}
              />
            ) : null
          }
        />
      ) : null}

      <UserDetailPanel
        key={panelOpen ? selectedUserId : 'closed'}
        userId={selectedUserId}
        open={panelOpen}
        onOpenChange={onPanelOpenChange}
        onUserUpdated={reloadList}
        onUserChange={onPanelUserChange}
      />
    </AdminPageLayout>
  );
}
