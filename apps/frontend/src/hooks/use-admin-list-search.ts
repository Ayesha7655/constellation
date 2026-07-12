'use client';

import { useCallback, useState } from 'react';

export function useAdminListSearch(resetPage: () => void) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFieldKey, setSearchFieldKey] = useState(0);

  const onSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      resetPage();
    },
    [resetPage],
  );

  const resetSearch = useCallback(() => {
    setSearchQuery('');
    setSearchFieldKey((current) => current + 1);
  }, []);

  const hasActiveSearch = searchQuery.trim().length > 0;

  return { searchQuery, onSearchChange, resetSearch, hasActiveSearch, searchFieldKey };
}
