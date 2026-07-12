'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { BreadcrumbItem } from '@/components/ui/breadcrumbs';

type DashboardBreadcrumbsContextValue = Readonly<{
  items: readonly BreadcrumbItem[];
  setRouteItems: (items: readonly BreadcrumbItem[]) => void;
  setOverrideItems: (items: readonly BreadcrumbItem[]) => void;
  clearOverrideItems: () => void;
}>;

const DashboardBreadcrumbsContext = createContext<DashboardBreadcrumbsContextValue | null>(null);

type DashboardBreadcrumbsProviderProps = Readonly<{
  children: ReactNode;
}>;

export function DashboardBreadcrumbsProvider({ children }: DashboardBreadcrumbsProviderProps) {
  const [routeItems, setRouteItemsState] = useState<readonly BreadcrumbItem[]>([]);
  const [overrideItems, setOverrideItemsState] = useState<readonly BreadcrumbItem[] | null>(null);

  const setRouteItems = useCallback((nextItems: readonly BreadcrumbItem[]) => {
    setRouteItemsState(nextItems);
  }, []);

  const setOverrideItems = useCallback((nextItems: readonly BreadcrumbItem[]) => {
    setOverrideItemsState(nextItems);
  }, []);

  const clearOverrideItems = useCallback(() => {
    setOverrideItemsState(null);
  }, []);

  const items = overrideItems ?? routeItems;

  const value = useMemo(
    () => ({
      items,
      setRouteItems,
      setOverrideItems,
      clearOverrideItems,
    }),
    [clearOverrideItems, items, setOverrideItems, setRouteItems],
  );

  return <DashboardBreadcrumbsContext.Provider value={value}>{children}</DashboardBreadcrumbsContext.Provider>;
}

export function useDashboardBreadcrumbsContext() {
  const context = useContext(DashboardBreadcrumbsContext);
  if (!context) {
    throw new Error('useDashboardBreadcrumbsContext must be used within DashboardBreadcrumbsProvider');
  }
  return context;
}
