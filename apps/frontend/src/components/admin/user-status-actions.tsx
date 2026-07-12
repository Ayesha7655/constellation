'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ADMIN } from '@constellation/shared';
import { Button } from '@constellation/shared/ui';
import { UserDeactivateDialog } from '@/components/admin/user-deactivate-dialog';
import { canDeactivateUser, canReactivateUser } from '@/lib/user-display';
import { showUserSuccessToast, showUserErrorToast } from '@/i18n/translate-user-message';
import { translateAuthRequestError } from '@/lib/user-messages';
import { updateUserStatus } from '@/services/admin-api';
import type { AdminUserDetail } from '@/types/admin-users';

type UserStatusActionsProps = Readonly<{
  user: AdminUserDetail;
  canManage: boolean;
  onUpdated: (user: AdminUserDetail) => void;
}>;

export function UserStatusActions({ user, canManage, onUpdated }: UserStatusActionsProps) {
  const t = useTranslations('dashboard.admin.users');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations();
  const [saving, setSaving] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const onReactivateClick = useCallback(() => {
    setSaving(true);
    void updateUserStatus(user.id, 'ACTIVE')
      .then((updated) => {
        showUserSuccessToast(t('actions.reactivateSuccess'));
        onUpdated(updated);
      })
      .catch((error: unknown) => {
        showUserErrorToast(translateAuthRequestError(error, tErrors));
      })
      .finally(() => {
        setSaving(false);
      });
  }, [onUpdated, t, tErrors, user.id]);

  const onDeactivateClick = useCallback(() => {
    setDeactivateOpen(true);
  }, []);

  const onDeactivateDialogOpenChange = useCallback((open: boolean) => {
    setDeactivateOpen(open);
  }, []);

  const onDeactivated = useCallback((updated: AdminUserDetail) => {
    onUpdated(updated);
  }, [onUpdated]);

  if (!canManage) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        {canDeactivateUser(user) ? (
          <Button
            type="button"
            variant="outline"
            fullWidth={false}
            disabled={saving}
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={onDeactivateClick}
          >
            {saving ? tCommon('waiting') : t('actions.deactivateLabel')}
          </Button>
        ) : null}
        {canReactivateUser(user) ? (
          <Button type="button" fullWidth={false} disabled={saving} onClick={onReactivateClick}>
            {saving ? tCommon('waiting') : t('actions.reactivateLabel')}
          </Button>
        ) : null}
      </div>
      <UserDeactivateDialog
        user={user}
        open={deactivateOpen}
        onOpenChange={onDeactivateDialogOpenChange}
        onDeactivated={onDeactivated}
      />
    </>
  );
}

export function userCanManageStatus(permissions: ReadonlyArray<{ key: string }>): boolean {
  return permissions.some((permission) => permission.key === ADMIN.USERS_UPDATE);
}
