'use client';

import { AdminListSearchField } from '@/components/admin/list/admin-list-search-field';
import { DetailRefreshButton } from '@/components/ui/detail-refresh-button';

type AdminListToolbarProps = Readonly<{
  searchQuery: string;
  searchFieldKey: number;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  searchTestId: string;
  refreshTestId: string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  searchMaxLengthMessage: string;
  refreshAriaLabel: string;
}>;

export function AdminListToolbar({
  searchQuery,
  searchFieldKey,
  onSearchChange,
  onRefresh,
  isRefreshing = false,
  searchTestId,
  refreshTestId,
  searchPlaceholder,
  searchAriaLabel,
  searchMaxLengthMessage,
  refreshAriaLabel,
}: AdminListToolbarProps) {
  return (
    <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto sm:flex-nowrap">
      <AdminListSearchField
        key={searchFieldKey}
        committedQuery={searchQuery}
        onDebouncedChange={onSearchChange}
        placeholder={searchPlaceholder}
        ariaLabel={searchAriaLabel}
        maxLengthMessage={searchMaxLengthMessage}
        testId={searchTestId}
      />
      <DetailRefreshButton
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        ariaLabel={refreshAriaLabel}
        testId={refreshTestId}
      />
    </div>
  );
}
