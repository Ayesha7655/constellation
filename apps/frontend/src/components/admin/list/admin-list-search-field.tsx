'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { LIST_TEXT_SEARCH_MAX_LENGTH } from '@constellation/shared';

const SEARCH_DEBOUNCE_MS = 400;

type AdminListSearchFieldProps = Readonly<{
  committedQuery: string;
  onDebouncedChange: (query: string) => void;
  placeholder: string;
  ariaLabel: string;
  maxLengthMessage: string;
  testId: string;
}>;

export function AdminListSearchField({
  committedQuery,
  onDebouncedChange,
  placeholder,
  ariaLabel,
  maxLengthMessage,
  testId,
}: AdminListSearchFieldProps) {
  const [draft, setDraft] = useState(committedQuery);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = draft.trim();
      if (trimmed !== committedQuery.trim()) {
        onDebouncedChange(trimmed);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [committedQuery, draft, onDebouncedChange]);

  const onSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value.slice(0, LIST_TEXT_SEARCH_MAX_LENGTH));
  }, []);

  const atMaxLength = draft.length >= LIST_TEXT_SEARCH_MAX_LENGTH;

  return (
    <div className="relative w-full sm:max-w-md">
      <Search
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={draft}
        onChange={onSearchChange}
        placeholder={placeholder}
        maxLength={LIST_TEXT_SEARCH_MAX_LENGTH}
        className="h-10 w-full rounded-md border border-border bg-background ps-10 pe-3 text-sm text-foreground placeholder:text-muted-foreground"
        data-testid={testId}
        aria-label={ariaLabel}
        aria-invalid={atMaxLength}
        aria-describedby={atMaxLength ? `${testId}-max-length` : undefined}
      />
      {atMaxLength ? (
        <p id={`${testId}-max-length`} className="mt-1 text-xs text-destructive">
          {maxLengthMessage}
        </p>
      ) : null}
    </div>
  );
}
