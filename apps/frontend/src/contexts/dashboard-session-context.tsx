'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { CurrentUser } from '@/services/auth-api';

const DashboardSessionContext = createContext<CurrentUser | null>(null);

type DashboardSessionProviderProps = Readonly<{
  user: CurrentUser;
  children: ReactNode;
}>;

export function DashboardSessionProvider({ user, children }: DashboardSessionProviderProps) {
  return <DashboardSessionContext.Provider value={user}>{children}</DashboardSessionContext.Provider>;
}

export function useDashboardSession(): CurrentUser {
  const user = useContext(DashboardSessionContext);
  if (!user) {
    throw new Error('useDashboardSession must be used within DashboardSessionProvider');
  }
  return user;
}
