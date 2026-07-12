'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TEST_IDS } from '@constellation/shared';
import { Button, LoadingIndicator, SidePanel } from '@constellation/shared/ui';
import { UserDetailsContent } from '@/components/admin/user-details-content';
import { UserStatusActions, userCanManageStatus } from '@/components/admin/user-status-actions';
import { DetailRefreshButton } from '@/components/ui/detail-refresh-button';
import { useDashboardSession } from '@/contexts/dashboard-session-context';
import { useLoadGeneration } from '@/hooks/use-load-generation';
import { userDisplayName } from '@/lib/user-display';
import { translateAuthRequestError } from '@/lib/user-messages';
import { DASHBOARD_BASE_PATH } from '@/lib/roles';
import { getUser } from '@/services/admin-api';
import type { AdminUserDetail } from '@/types/admin-users';

type UserDetailPanelProps = Readonly<{
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
  onUserChange: (user: AdminUserDetail | null) => void;
}>;

type LoadState =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error' }>
  | Readonly<{ status: 'ready'; user: AdminUserDetail }>;

function initialLoadState(userId: string | null): LoadState {
  return userId ? { status: 'loading' } : { status: 'idle' };
}

export function UserDetailPanel({
  userId,
  open,
  onOpenChange,
  onUserUpdated,
  onUserChange,
}: UserDetailPanelProps) {
  const t = useTranslations('dashboard.admin.users');
  const tControls = useTranslations('dashboard.admin.listControls');
  const tErrors = useTranslations();
  const { permissions } = useDashboardSession();
  const [loadState, setLoadState] = useState<LoadState>(() => initialLoadState(userId));
  const [actionError, setActionError] = useState<string | null>(null);
  const { startLoad, isCurrentLoad } = useLoadGeneration();

  const canManage = userCanManageStatus(permissions);

  useEffect(() => {
    if (!open || !userId) {
      onUserChange(null);
      return;
    }

    const generation = startLoad();
    let cancelled = false;

    void getUser(userId)
      .then((loadedUser) => {
        if (cancelled || !isCurrentLoad(generation)) {
          return;
        }
        setLoadState({ status: 'ready', user: loadedUser });
        onUserChange(loadedUser);
        setActionError(null);
      })
      .catch((error: unknown) => {
        if (cancelled || !isCurrentLoad(generation)) {
          return;
        }
        setActionError(translateAuthRequestError(error, tErrors));
        setLoadState({ status: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [isCurrentLoad, onUserChange, open, startLoad, tErrors, userId]);

  const onPanelOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
      if (!nextOpen) {
        setLoadState({ status: 'idle' });
        setActionError(null);
        onUserChange(null);
      }
    },
    [onOpenChange, onUserChange],
  );

  const reloadUser = useCallback(() => {
    if (!userId) {
      return;
    }
    const generation = startLoad();
    setLoadState({ status: 'loading' });
    setActionError(null);
    void getUser(userId)
      .then((loadedUser) => {
        if (!isCurrentLoad(generation)) {
          return;
        }
        setLoadState({ status: 'ready', user: loadedUser });
        onUserChange(loadedUser);
        onUserUpdated();
      })
      .catch((error: unknown) => {
        if (!isCurrentLoad(generation)) {
          return;
        }
        setActionError(translateAuthRequestError(error, tErrors));
        setLoadState({ status: 'error' });
      });
  }, [isCurrentLoad, onUserChange, onUserUpdated, startLoad, tErrors, userId]);

  const onUserStatusUpdated = useCallback(
    (updatedUser: AdminUserDetail) => {
      setLoadState({ status: 'ready', user: updatedUser });
      setActionError(null);
      onUserChange(updatedUser);
      onUserUpdated();
    },
    [onUserChange, onUserUpdated],
  );

  const onRetryClick = useCallback(() => {
    reloadUser();
  }, [reloadUser]);

  const user = loadState.status === 'ready' ? loadState.user : null;
  const fullPageHref = userId ? `${DASHBOARD_BASE_PATH.superAdmin}/users/${userId}` : undefined;

  return (
    <SidePanel
      open={open}
      onOpenChange={onPanelOpenChange}
      title={user ? userDisplayName(user) : t('detail.title')}
      description={user?.email}
      testId={TEST_IDS.users.detailPanel}
      headerActions={
        fullPageHref ? (
          <div className="flex items-center gap-1">
            <DetailRefreshButton
              onRefresh={reloadUser}
              isRefreshing={loadState.status === 'loading'}
              ariaLabel={tControls('refreshDetailLabel')}
              testId={TEST_IDS.users.panelRefresh}
            />
            <Link
              href={fullPageHref}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={TEST_IDS.users.openFullPage}
              className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t('detail.openFullPage')}
            >
              <ExternalLink className="size-5" aria-hidden />
            </Link>
          </div>
        ) : undefined
      }
      footer={
        user ? (
          <UserStatusActions user={user} canManage={canManage} onUpdated={onUserStatusUpdated} />
        ) : undefined
      }
    >
      {actionError ? <p className="mb-4 text-sm text-destructive">{actionError}</p> : null}

      {loadState.status === 'loading' ? (
        <LoadingIndicator label={t('detail.loading')} className="min-h-[min(24rem,60vh)]" />
      ) : null}

      {loadState.status === 'error' ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-destructive">{t('detail.loadError')}</p>
          <Button variant="outline" fullWidth={false} onClick={onRetryClick}>
            {t('retry')}
          </Button>
        </div>
      ) : null}

      {user ? <UserDetailsContent user={user} /> : null}
    </SidePanel>
  );
}
