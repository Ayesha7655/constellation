'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { TEST_IDS } from '../test-ids';

export type MarketplaceBrowseSearchFieldLabels = Readonly<{
  placeholder: string;
}>;

type MarketplaceBrowseSearchFieldProps = Readonly<{
  committedQuery: string;
  onDebouncedChange: (query: string) => void;
  debounceMs: number;
  labels: MarketplaceBrowseSearchFieldLabels;
}>;

export function MarketplaceBrowseSearchField({
  committedQuery,
  onDebouncedChange,
  debounceMs,
  labels,
}: MarketplaceBrowseSearchFieldProps) {
  const [draft, setDraft] = useState(committedQuery);

  useEffect(() => {
    setDraft(committedQuery);
  }, [committedQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = draft.trim();
      if (trimmed !== committedQuery.trim()) {
        onDebouncedChange(trimmed);
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [committedQuery, debounceMs, draft, onDebouncedChange]);

  const onSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
  }, []);

  return (
    <div className="relative flex-1 sm:max-w-md">
      <Search
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={draft}
        onChange={onSearchChange}
        placeholder={labels.placeholder}
        className="h-10 w-full rounded-md border border-border bg-background ps-10 pe-3 text-sm text-foreground placeholder:text-muted-foreground"
        data-testid={TEST_IDS.marketplace.browse.search}
        aria-label={labels.placeholder}
      />
    </div>
  );
}
