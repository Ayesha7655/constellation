'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { StatusBadge } from '@constellation/shared/ui';
import { mergeUserRolesForDisplay, userRoleBadgeVariant, userStatusVariant } from '@/lib/user-display';
import type { AdminUserDetail } from '@/types/admin-users';

type UserDetailsContentProps = Readonly<{
  user: AdminUserDetail;
}>;

export function UserDetailsContent({ user }: UserDetailsContentProps) {
  const t = useTranslations('dashboard.admin.users.detail');
  const tUsers = useTranslations('dashboard.admin.users');

  const displayRoles = useMemo(() => mergeUserRolesForDisplay(user), [user]);

  return (
    <div className="flex flex-col gap-6 md:max-w-3xl">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1">
          <StatusBadge label={tUsers(`status.${user.status}`)} variant={userStatusVariant(user.status)} />
        </div>
        <div className="flex flex-wrap gap-1">
          {displayRoles.map((role) => (
            <StatusBadge
              key={role.key}
              label={role.label}
              variant={userRoleBadgeVariant(role.key, user.primaryRole.key)}
            />
          ))}
        </div>
      </section>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('organization')}</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{user.orgName ?? '—'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('orgAddress')}</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{user.orgAddress ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('contact')}</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{user.name}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('email')}</dt>
          <dd className="mt-1 break-all text-sm font-medium text-foreground">{user.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('joined')}</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{new Date(user.createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('lastLogin')}</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : t('neverLoggedIn')}
          </dd>
        </div>
      </dl>
    </div>
  );
}
