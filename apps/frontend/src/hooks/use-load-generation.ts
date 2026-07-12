'use client';

import { useCallback, useRef } from 'react';

/** Incrementing generation counter so stale async detail/list reloads cannot overwrite newer results. */
export function useLoadGeneration() {
  const generationRef = useRef(0);

  const startLoad = useCallback((): number => {
    generationRef.current += 1;
    return generationRef.current;
  }, []);

  const isCurrentLoad = useCallback((generation: number): boolean => {
    return generationRef.current === generation;
  }, []);

  return { startLoad, isCurrentLoad };
}
