'use client';

import { useEffect } from 'react';
import type { BreadcrumbItem } from '@/components/ui/breadcrumbs';
import { useDashboardBreadcrumbsContext } from '@/contexts/dashboard-breadcrumbs-context';

function breadcrumbKey(items: readonly BreadcrumbItem[]): string {
  return items.map((item) => `${item.label}:${item.href ?? ''}`).join('|');
}

/** Override route-derived header breadcrumbs for the current page; clears on unmount. */
export function useDashboardBreadcrumbs(items: readonly BreadcrumbItem[]) {
  const { setOverrideItems, clearOverrideItems } = useDashboardBreadcrumbsContext();
  const itemsKey = breadcrumbKey(items);

  useEffect(() => {
    if (itemsKey.length === 0) {
      clearOverrideItems();
    } else {
      setOverrideItems(items);
    }
    return clearOverrideItems;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- itemsKey serializes `items`; omit ref to avoid [] loops
  }, [clearOverrideItems, itemsKey, setOverrideItems]);
}
