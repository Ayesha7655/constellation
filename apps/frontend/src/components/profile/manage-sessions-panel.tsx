'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button, Checkbox, FormActions, LoadingIndicator } from '@constellation/shared/ui';
import { cn } from '@/lib/utils';
import { showProfileError, showProfileErrorMessage, showProfileSuccess } from '@/components/profile/profile-toast';
import { getMySessions, revokeMySessions, type SessionItem } from '@/services/auth-api';

type LoadState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error' }>
  | Readonly<{ status: 'ready' }>;

type LoadMode = 'retry' | 'refresh';

function describeDevice(session: SessionItem, fallback: string): string {
  const ua = session.userAgent ?? '';
  const platformLabel =
    session.platform === 'ANDROID' ? 'Android' : session.platform === 'IOS' ? 'iOS' : 'Web';
  const browser = /edg/i.test(ua)
    ? 'Edge'
    : /chrome/i.test(ua)
      ? 'Chrome'
      : /firefox/i.test(ua)
        ? 'Firefox'
        : /safari/i.test(ua)
          ? 'Safari'
          : '';
  const parts = [platformLabel, browser].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : fallback;
}

function SessionRow({
  session,
  selectable,
  selected,
  isCurrent,
  onToggle,
  locale,
  t,
}: Readonly<{
  session: SessionItem;
  selectable: boolean;
  selected: boolean;
  isCurrent: boolean;
  onToggle: (id: string, checked: boolean) => void;
  locale: string;
  t: ReturnType<typeof useTranslations<'dashboard.profile.sessions'>>;
}>) {
  const label = describeDevice(session, t('unknownDevice'));
  const lastActive = new Date(session.lastActiveAt).toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="flex items-start gap-3 rounded-md border border-border px-3 py-3">
      {selectable ? (
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onToggle(session.id, checked)}
          aria-label={t('selectDevice', { device: label })}
        />
      ) : (
        <span className="mt-0.5 inline-block size-4 shrink-0" aria-hidden />
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
          {label}
          {isCurrent ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {t('currentBadge')}
            </span>
          ) : null}
        </span>
        <span className="text-xs text-muted-foreground">{t('lastActive', { time: lastActive })}</span>
        {session.ipAddress ? (
          <span className="text-xs text-muted-foreground">{t('ipAddress', { ip: session.ipAddress })}</span>
        ) : null}
      </div>
    </div>
  );
}

function applySessions(
  sessions: readonly SessionItem[],
): Readonly<{ current: SessionItem | null; others: SessionItem[]; selected: ReadonlySet<string> }> {
  const currentSession = sessions.find((session) => session.isCurrent) ?? null;
  const otherSessions = sessions.filter((session) => !session.isCurrent);
  return {
    current: currentSession,
    others: otherSessions,
    selected: new Set(otherSessions.map((session) => session.id)),
  };
}

async function fetchSessionSnapshot() {
  const { sessions } = await getMySessions();
  return applySessions(sessions);
}

export function ManageSessionsPanel({ onChanged }: Readonly<{ onChanged?: () => void }>) {
  const t = useTranslations('dashboard.profile.sessions');
  const tErrors = useTranslations();
  const locale = useLocale();
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const [current, setCurrent] = useState<SessionItem | null>(null);
  const [others, setOthers] = useState<SessionItem[]>([]);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [revoking, setRevoking] = useState(false);

  const applySnapshot = useCallback((next: ReturnType<typeof applySessions>) => {
    setCurrent(next.current);
    setOthers(next.others);
    setSelected(next.selected);
    setLoadState({ status: 'ready' });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchSessionSnapshot()
      .then((next) => {
        if (cancelled) {
          return;
        }
        applySnapshot(next);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setLoadState({ status: 'error' });
        showProfileErrorMessage(t('loadError'));
      });
    return () => {
      cancelled = true;
    };
  }, [applySnapshot, t]);

  const loadSessions = useCallback(async (mode: LoadMode) => {
    if (mode === 'retry') {
      setLoadState({ status: 'loading' });
    } else {
      setRefreshing(true);
    }

    try {
      const next = await fetchSessionSnapshot();
      applySnapshot(next);
    } catch (err) {
      if (mode === 'retry') {
        setLoadState({ status: 'error' });
        showProfileErrorMessage(t('loadError'));
      } else {
        showProfileError(err, (key) => tErrors(key as never));
      }
    } finally {
      setRefreshing(false);
    }
  }, [applySnapshot, t, tErrors]);

  const onRetry = useCallback(() => {
    void loadSessions('retry');
  }, [loadSessions]);

  const toggleOne = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (checked: boolean) => {
      setSelected(checked ? new Set(others.map((session) => session.id)) : new Set());
    },
    [others],
  );

  const onRevoke = useCallback(async () => {
    if (selected.size === 0) {
      return;
    }
    setRevoking(true);
    try {
      const result = await revokeMySessions([...selected]);
      showProfileSuccess(t('revokedNotice', { count: result.revokedCount }));
      onChanged?.();
      await loadSessions('refresh');
    } catch (err) {
      showProfileError(err, (key) => tErrors(key as never));
    } finally {
      setRevoking(false);
    }
  }, [selected, onChanged, loadSessions, t, tErrors]);

  if (loadState.status === 'loading') {
    return (
      <div className="flex min-h-[min(24rem,60vh)] items-center justify-center">
        <LoadingIndicator label={t('loading')} />
      </div>
    );
  }

  if (loadState.status === 'error') {
    return (
      <div className="flex min-h-[min(24rem,40vh)] flex-col items-start justify-center gap-3">
        <p className="text-sm text-destructive">{t('loadError')}</p>
        <FormActions>
          <Button type="button" variant="outline" fullWidth={false} onClick={onRetry}>
            {t('retry')}
          </Button>
        </FormActions>
      </div>
    );
  }

  const allSelected = others.length > 0 && selected.size === others.length;

  return (
    <div className="relative min-h-[min(16rem,40vh)]">
      {refreshing ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/60 transition-opacity duration-300 ease-out motion-reduce:transition-none">
          <LoadingIndicator label={t('loading')} />
        </div>
      ) : null}

      <div
        className={cn(
          'flex flex-col gap-4 transition-opacity duration-300 ease-out motion-reduce:transition-none',
          refreshing ? 'pointer-events-none opacity-40' : 'opacity-100',
        )}
      >
        {current ? (
          <SessionRow
            session={current}
            selectable={false}
            selected={false}
            isCurrent
            onToggle={toggleOne}
            locale={locale}
            t={t}
          />
        ) : null}

        {others.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noOthers')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{t('otherDevicesHeading')}</span>
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} label={t('selectAll')} />
            </div>
            <div className="flex flex-col gap-2">
              {others.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  selectable
                  selected={selected.has(session.id)}
                  isCurrent={false}
                  onToggle={toggleOne}
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
            <FormActions>
              <Button
                type="button"
                fullWidth={false}
                disabled={revoking || refreshing || selected.size === 0}
                onClick={onRevoke}
              >
                {revoking ? t('revoking') : t('revokeSelected', { count: selected.size })}
              </Button>
            </FormActions>
          </div>
        )}
      </div>
    </div>
  );
}
