'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TEST_IDS } from '@constellation/shared';
import { Button, LoadingIndicator, PageBackLink } from '@constellation/shared/ui';
import { UserDetailsContent } from '@/components/admin/user-details-content';
import { UserStatusActions, userCanManageStatus } from '@/components/admin/user-status-actions';
import { AdminPageLayout } from '@/components/layout/admin-page-layout';
import type { BreadcrumbItem } from '@/components/ui/breadcrumbs';
import { useDashboardSession } from '@/contexts/dashboard-session-context';
import { useDashboardBreadcrumbs } from '@/hooks/use-dashboard-breadcrumbs';
import { userDisplayName } from '@/lib/user-display';
import { translateAuthRequestError } from '@/lib/user-messages';
import { DASHBOARD_BASE_PATH } from '@/lib/roles';
import { Link } from '@/i18n/navigation';
import { getUser } from '@/services/admin-api';
import type { AdminUserDetail } from '@/types/admin-users';

type UserDetailPageViewProps = Readonly<{
  userId: string;
}>;

type LoadState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error' }>
  | Readonly<{ status: 'ready'; user: AdminUserDetail }>;

export function UserDetailPageView({ userId }: UserDetailPageViewProps) {
  const t = useTranslations('dashboard.admin.users');
  const tDashboard = useTranslations('dashboard');
  const tErrors = useTranslations();
  const { permissions } = useDashboardSession();
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [actionError, setActionError] = useState<string | null>(null);

  const canManage = userCanManageStatus(permissions);
  const user = loadState.status === 'ready' ? loadState.user : null;

  const breadcrumbs = useMemo((): readonly BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: tDashboard('admin.title'), href: DASHBOARD_BASE_PATH.superAdmin },
      { label: t('title'), href: `${DASHBOARD_BASE_PATH.superAdmin}/users` },
    ];
    if (user) {
      items.push({
        label: userDisplayName(user),
        href: `${DASHBOARD_BASE_PATH.superAdmin}/users/${user.id}`,
      });
    } else {
      items.push({ label: t('detail.title') });
    }
    return items;
  }, [t, tDashboard, user]);

  useDashboardBreadcrumbs(breadcrumbs);

  const backLink = (
    <PageBackLink
      href={`${DASHBOARD_BASE_PATH.superAdmin}/users`}
      label={t('detail.back')}
      testId={TEST_IDS.users.back}
      LinkComponent={Link}
    />
  );

  useEffect(() => {
    let cancelled = false;

    void getUser(userId)
      .then((loadedUser) => {
        if (!cancelled) {
          setLoadState({ status: 'ready', user: loadedUser });
          setActionError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setActionError(translateAuthRequestError(error, tErrors));
          setLoadState({ status: 'error' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId, tErrors]);

  const onRetryClick = useCallback(() => {
    setLoadState({ status: 'loading' });
    setActionError(null);
    void getUser(userId)
      .then((loadedUser) => {
        setLoadState({ status: 'ready', user: loadedUser });
      })
      .catch((error: unknown) => {
        setActionError(translateAuthRequestError(error, tErrors));
        setLoadState({ status: 'error' });
      });
  }, [userId, tErrors]);

  const onUserStatusUpdated = useCallback((updatedUser: AdminUserDetail) => {
    setLoadState({ status: 'ready', user: updatedUser });
    setActionError(null);
  }, []);

  if (loadState.status === 'loading') {
    return (
      <AdminPageLayout title={t('detail.title')} backLink={backLink}>
        <LoadingIndicator label={t('detail.loading')} className="min-h-[min(24rem,50vh)]" />
      </AdminPageLayout>
    );
  }

  if (loadState.status === 'error') {
    return (
      <AdminPageLayout
        title={t('detail.title')}
        description={t('detail.loadError')}
        backLink={backLink}
      >
        {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
        <Button variant="outline" fullWidth={false} onClick={onRetryClick} testId={TEST_IDS.users.detailRetry}>
          {t('retry')}
        </Button>
      </AdminPageLayout>
    );
  }

  const { user: loadedUser } = loadState;

  return (
    <AdminPageLayout
      title={userDisplayName(loadedUser)}
      description={loadedUser.email}
      backLink={backLink}
      actions={
        canManage ? (
          <UserStatusActions user={loadedUser} canManage={canManage} onUpdated={onUserStatusUpdated} />
        ) : undefined
      }
    >
      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
      <UserDetailsContent user={loadedUser} />
    </AdminPageLayout>
  );
}
