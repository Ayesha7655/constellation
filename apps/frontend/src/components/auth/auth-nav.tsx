'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuthRole } from '@/hooks/use-auth-role';
import { getDashboardHomePath } from '@/lib/auth-session';
import { clearClientAuthSession } from '@/lib/clear-client-auth';
import { logTechnicalError } from '@/lib/user-messages';
import { cn } from '@/lib/utils';
import { logout } from '@/services/auth-api';
import { TEST_IDS, resolveDashboardProfilePathFromHome } from '@constellation/shared';

type NavMenuItem = Readonly<{
  type: 'link';
  href: string;
  label: string;
  testId: string;
}>;

type NavMenuAction = Readonly<{
  type: 'action';
  label: string;
  testId: string;
  onSelect: () => void;
  icon?: 'sign-out';
}>;

type NavMenuEntry = NavMenuItem | NavMenuAction;

type NavAccountMenuProps = Readonly<{
  items: readonly NavMenuEntry[];
  triggerTestId: string;
}>;

function NavAccountMenu({ items, triggerTestId }: NavAccountMenuProps) {
  const t = useTranslations('nav');
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; minWidth: number } | null>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 4,
      left: rect.right,
      minWidth: Math.max(rect.width, 176),
    });
  }, []);

  const onToggleClick = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  useEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    const handleReposition = () => updatePosition();

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [closeMenu, open, updatePosition]);

  const menu =
    open && position && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={t('accountMenu')}
            style={{
              top: position.top,
              left: position.left,
              minWidth: position.minWidth,
              transform: 'translateX(-100%)',
            }}
            className={cn(
              'fixed z-[60] overflow-hidden rounded-md border border-border',
              'bg-popover p-1 shadow-md',
            )}
          >
            {items.map((item) =>
              item.type === 'link' ? (
                <Link
                  key={item.testId}
                  href={item.href}
                  role="menuitem"
                  data-testid={item.testId}
                  onClick={closeMenu}
                  className={cn(
                    'flex w-full items-center rounded-sm px-2.5 py-2 text-sm',
                    'text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.testId}
                  type="button"
                  role="menuitem"
                  data-testid={item.testId}
                  onClick={() => {
                    item.onSelect();
                    closeMenu();
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-start text-sm',
                    'text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {item.icon === 'sign-out' ? <LogOut className="size-4 shrink-0" aria-hidden /> : null}
                  {item.label}
                </button>
              ),
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-label={t('accountMenu')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        data-testid={triggerTestId}
        onClick={onToggleClick}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5',
          'text-sm text-muted-foreground transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        <User className="size-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">{t('account')}</span>
        <ChevronDown
          className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {menu}
    </div>
  );
}

export function AuthNav() {
  const t = useTranslations('nav');
  const router = useRouter();
  const role = useAuthRole();
  const storedDashboardHref = getDashboardHomePath();
  const dashboardHref = storedDashboardHref ?? '/';
  const profileHref = storedDashboardHref
    ? resolveDashboardProfilePathFromHome(storedDashboardHref)
    : '/profile';

  const handleSignOut = useCallback(async () => {
    const { serverRevoked } = await logout();
    if (!serverRevoked) {
      logTechnicalError(
        'auth-nav sign-out',
        'Server could not revoke session; local session cleared',
      );
    }
    await clearClientAuthSession();
    router.replace('/');
  }, [router]);

  const onSignOutClick = useCallback(() => {
    void handleSignOut();
  }, [handleSignOut]);

  if (!role) {
    const items: NavMenuEntry[] = [
      { type: 'link', href: '/sign-in', label: t('signIn'), testId: TEST_IDS.nav.signIn },
      { type: 'link', href: '/sign-up', label: t('signUp'), testId: TEST_IDS.nav.signUp },
    ];
    return <NavAccountMenu items={items} triggerTestId={TEST_IDS.nav.accountMenu} />;
  }

  const items: NavMenuEntry[] = [
    { type: 'link', href: dashboardHref, label: t('dashboard'), testId: TEST_IDS.nav.dashboard },
    { type: 'link', href: profileHref, label: t('profile'), testId: TEST_IDS.nav.profile },
    { type: 'action', label: t('signOut'), testId: TEST_IDS.nav.signOut, onSelect: onSignOutClick, icon: 'sign-out' },
  ];
  return <NavAccountMenu items={items} triggerTestId={TEST_IDS.nav.accountMenu} />;
}
