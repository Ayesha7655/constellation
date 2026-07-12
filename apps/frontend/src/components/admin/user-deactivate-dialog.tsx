'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TEST_IDS } from '@constellation/shared';
import { Button, Dialog } from '@constellation/shared/ui';
import { userDisplayName } from '@/lib/user-display';
import { showUserSuccessToast } from '@/i18n/translate-user-message';
import { translateAuthRequestError } from '@/lib/user-messages';
import { updateUserStatus } from '@/services/admin-api';
import type { AdminUserDetail } from '@/types/admin-users';

type UserDeactivateDialogProps = Readonly<{
  user: AdminUserDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeactivated: (user: AdminUserDetail) => void;
}>;

export function UserDeactivateDialog({ user, open, onOpenChange, onDeactivated }: UserDeactivateDialogProps) {
  const t = useTranslations('dashboard.admin.users');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onDeactivateDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isSaving) {
        return;
      }
      if (!nextOpen) {
        setErrorMessage(null);
      }
      onOpenChange(nextOpen);
    },
    [isSaving, onOpenChange],
  );

  const onConfirmClick = useCallback(async () => {
    if (!user) {
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = await updateUserStatus(user.id, 'DEACTIVATED');
      showUserSuccessToast(t('deactivate.success'));
      onDeactivated(updated);
      setIsSaving(false);
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(translateAuthRequestError(error, tErrors));
      setIsSaving(false);
    }
  }, [onDeactivated, onOpenChange, t, tErrors, user]);

  const onCancelClick = useCallback(() => {
    onDeactivateDialogOpenChange(false);
  }, [onDeactivateDialogOpenChange]);

  if (!user) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onDeactivateDialogOpenChange}
      title={t('deactivate.title')}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            fullWidth={false}
            onClick={onCancelClick}
            disabled={isSaving}
            testId={TEST_IDS.users.deactivateCancel}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            variant="outline"
            fullWidth={false}
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={onConfirmClick}
            disabled={isSaving}
            testId={TEST_IDS.users.deactivateConfirm}
          >
            {isSaving ? tCommon('waiting') : t('deactivate.confirm')}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground">
        {t('deactivate.description', { name: userDisplayName(user) })}
      </p>
      {errorMessage ? <p className="mt-3 text-sm text-destructive">{errorMessage}</p> : null}
    </Dialog>
  );
}
